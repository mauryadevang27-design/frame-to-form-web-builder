import http from "node:http";
import crypto from "node:crypto";

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Room code alphabet (no look-alikes)
const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

// In-memory room and socket state
const rooms = new Map();
const clients = new Map(); // socket -> { id, roomCode, participant }

class WsConnection {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.id = "s_" + Math.random().toString(36).slice(2, 9);

    socket.on("data", (chunk) => this.handleData(chunk));
    socket.on("close", () => this.handleClose());
    socket.on("error", () => this.handleClose());
  }

  send(data) {
    if (this.socket.destroyed) return;
    const json = typeof data === "string" ? data : JSON.stringify(data);
    const payload = Buffer.from(json, "utf-8");
    const len = payload.length;

    let header;
    if (len <= 125) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + text opcode
      header[1] = len;
    } else if (len <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }

    this.socket.write(Buffer.concat([header, payload]));
  }

  handleData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const byte1 = this.buffer[0];
      const byte2 = this.buffer[1];
      const opcode = byte1 & 0x0f;
      const isMasked = (byte2 & 0x80) !== 0;
      let payloadLen = byte2 & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (this.buffer.length < 4) return;
        payloadLen = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (this.buffer.length < 10) return;
        payloadLen = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }

      let maskKey = null;
      if (isMasked) {
        if (this.buffer.length < offset + 4) return;
        maskKey = this.buffer.subarray(offset, offset + 4);
        offset += 4;
      }

      if (this.buffer.length < offset + payloadLen) return;

      const rawPayload = this.buffer.subarray(offset, offset + payloadLen);
      this.buffer = this.buffer.subarray(offset + payloadLen);

      // Unmask
      const unmasked = Buffer.alloc(payloadLen);
      if (isMasked && maskKey) {
        for (let i = 0; i < payloadLen; i++) {
          unmasked[i] = rawPayload[i] ^ maskKey[i % 4];
        }
      } else {
        rawPayload.copy(unmasked);
      }

      if (opcode === 0x08) {
        // Connection close
        this.socket.destroy();
        return;
      } else if (opcode === 0x09) {
        // Ping -> respond with Pong
        const pong = Buffer.from([0x8a, 0x00]);
        this.socket.write(pong);
      } else if (opcode === 0x01) {
        // Text message
        try {
          const str = unmasked.toString("utf-8");
          const msg = JSON.parse(str);
          onClientMessage(this, msg);
        } catch (e) {
          console.error("[WS] Parse error:", e);
        }
      }
    }
  }

  handleClose() {
    onClientDisconnect(this);
  }
}

// Broadcast to room
function broadcastToRoom(roomCode, msg, excludeWsId = null) {
  const room = rooms.get(roomCode);
  if (!room) return;

  for (const client of clients.values()) {
    if (client.roomCode === roomCode && client.ws.id !== excludeWsId) {
      client.ws.send(msg);
    }
  }
}

function computeCurrentPosition(room) {
  if (!room.playback.isPlaying) return room.playback.positionSec;
  const elapsed = (Date.now() - room.playback.updatedAt) / 1000;
  const pos = room.playback.positionSec + elapsed;
  if (room.video?.durationSec) {
    return Math.min(room.video.durationSec, pos);
  }
  return pos;
}

// Handle message protocols
function onClientMessage(ws, msg) {
  const { type, requestId, payload } = msg;

  switch (type) {
    case "room:create": {
      let code = generateRoomCode();
      while (rooms.has(code)) code = generateRoomCode();

      const host = {
        id: payload.host.id,
        name: payload.host.name,
        tone: payload.host.tone || "violet",
        isHost: true,
        status: "online",
      };

      const room = {
        code,
        name: payload.name?.trim() || `${host.name}'s Room`,
        inviteLink: `https://togethertube.app/join/${code}`,
        hostId: host.id,
        participants: [host],
        video: payload.video || null,
        playback: { isPlaying: false, positionSec: 0, updatedAt: Date.now() },
        createdAt: Date.now(),
        chatHistory: [],
      };

      rooms.set(code, room);
      clients.set(ws.id, { ws, roomCode: code, participant: host });

      ws.send({
        type: "response",
        requestId,
        payload: { ok: true, room },
      });
      console.log(`[Room Created] ${code} by ${host.name}`);
      break;
    }

    case "room:preview": {
      const room = rooms.get(payload.code?.toUpperCase().replace(/[\s-]/g, ""));
      if (!room) {
        ws.send({ type: "response", requestId, payload: { ok: false, error: "not_found" } });
        return;
      }
      const host = room.participants.find((p) => p.id === room.hostId);
      ws.send({
        type: "response",
        requestId,
        payload: {
          ok: true,
          preview: {
            code: room.code,
            name: room.name,
            hostName: host?.name || "Host",
            participantCount: room.participants.filter((p) => p.status === "online").length,
            video: room.video,
          },
        },
      });
      break;
    }

    case "room:join": {
      const code = payload.code?.toUpperCase().replace(/[\s-]/g, "");
      const room = rooms.get(code);
      if (!room) {
        ws.send({ type: "response", requestId, payload: { ok: false, error: "not_found" } });
        return;
      }

      const guest = {
        id: payload.participant.id,
        name: payload.participant.name,
        tone: payload.participant.tone || "blue",
        isHost: false,
        status: "online",
      };

      // Check if existing or new
      const existingIdx = room.participants.findIndex((p) => p.id === guest.id);
      if (existingIdx !== -1) {
        room.participants[existingIdx].status = "online";
        room.participants[existingIdx].name = guest.name;
      } else {
        room.participants.push(guest);
      }

      clients.set(ws.id, { ws, roomCode: code, participant: guest });

      // Calculate late-joiner playback sync position
      const computedPos = computeCurrentPosition(room);
      const syncedPlayback = {
        isPlaying: room.playback.isPlaying,
        positionSec: computedPos,
        updatedAt: Date.now(),
      };

      ws.send({
        type: "response",
        requestId,
        payload: {
          ok: true,
          room: { ...room, playback: syncedPlayback },
          chatHistory: room.chatHistory,
        },
      });

      // Broadcast new participant to others in room
      broadcastToRoom(
        code,
        {
          type: "event",
          event: { type: "participant_joined", participant: guest },
        },
        ws.id,
      );
      console.log(`[Room Joined] ${guest.name} -> ${code}`);
      break;
    }

    case "playback:update": {
      const client = clients.get(ws.id);
      if (!client) return;
      const room = rooms.get(client.roomCode);
      if (!room || room.hostId !== client.participant.id) return; // Host only

      room.playback = {
        isPlaying: payload.playback.isPlaying,
        positionSec: Math.max(0, payload.playback.positionSec),
        updatedAt: payload.playback.updatedAt || Date.now(),
      };

      broadcastToRoom(
        room.code,
        {
          type: "event",
          event: { type: "playback", playback: room.playback },
        },
        ws.id,
      );
      break;
    }

    case "video:update": {
      const client = clients.get(ws.id);
      if (!client) return;
      const room = rooms.get(client.roomCode);
      if (!room || room.hostId !== client.participant.id) return;

      room.video = payload.video;
      room.playback = { isPlaying: false, positionSec: 0, updatedAt: Date.now() };

      broadcastToRoom(room.code, {
        type: "event",
        event: { type: "video_changed", video: room.video },
      });
      break;
    }

    case "chat:send": {
      const client = clients.get(ws.id);
      if (!client) return;
      const room = rooms.get(client.roomCode);
      if (!room) return;

      const text = payload.text?.trim();
      if (!text) return;

      const message = {
        id: "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        senderId: client.participant.id,
        senderName: client.participant.name,
        senderTone: client.participant.tone,
        text,
        timestamp: Date.now(),
      };

      room.chatHistory.push(message);
      if (room.chatHistory.length > 100) room.chatHistory.shift();

      broadcastToRoom(room.code, {
        type: "chat:message",
        message,
      });

      ws.send({ type: "response", requestId, payload: { ok: true, message } });
      break;
    }

    case "webrtc:signal": {
      const client = clients.get(ws.id);
      if (!client) return;

      // Relay signal to target client
      const targetId = payload.to;
      for (const other of clients.values()) {
        if (other.roomCode === client.roomCode && other.participant.id === targetId) {
          other.ws.send({
            type: "webrtc:signal",
            signal: {
              ...payload,
              from: client.participant.id,
              fromName: client.participant.name,
            },
          });
          break;
        }
      }
      break;
    }

    case "room:leave": {
      onClientDisconnect(ws);
      break;
    }
  }
}

function onClientDisconnect(ws) {
  const client = clients.get(ws.id);
  if (!client) return;
  clients.delete(ws.id);

  const room = rooms.get(client.roomCode);
  if (!room) return;

  const p = room.participants.find((x) => x.id === client.participant.id);
  if (p) p.status = "offline";

  broadcastToRoom(room.code, {
    type: "event",
    event: { type: "participant_left", participantId: client.participant.id },
  });

  if (p && p.isHost) {
    // Host disconnected
    if (room.playback.isPlaying) {
      room.playback.positionSec = computeCurrentPosition(room);
      room.playback.isPlaying = false;
      room.playback.updatedAt = Date.now();
    }
    broadcastToRoom(room.code, {
      type: "event",
      event: { type: "host_presence", online: false },
    });
  }

  // Cleanup empty rooms after delay
  const activeCount = room.participants.filter((x) => x.status === "online").length;
  if (activeCount === 0) {
    setTimeout(() => {
      const current = rooms.get(room.code);
      if (current && current.participants.every((x) => x.status === "offline")) {
        rooms.delete(room.code);
        console.log(`[Room Deleted] Empty room ${room.code} cleaned up.`);
      }
    }, 60000);
  }
}

// HTTP Server
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        server: "TogetherTube Standalone Realtime Server",
        activeRooms: rooms.size,
        connectedSockets: clients.size,
        uptime: process.uptime(),
        timestamp: Date.now(),
      }),
    );
    return;
  }

  const match = req.url?.match(/^\/api\/rooms\/([A-Za-z0-9]+)$/);
  if (match) {
    const code = match[1].toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not_found" }));
      return;
    }
    const host = room.participants.find((p) => p.id === room.hostId);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        code: room.code,
        name: room.name,
        hostName: host?.name || "Host",
        participantCount: room.participants.filter((p) => p.status === "online").length,
        video: room.video,
      }),
    );
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("TogetherTube Realtime Server is running.");
});

// Upgrade to WebSocket
server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash("sha1")
    .update(key + GUID)
    .digest("base64");

  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
  );

  new WsConnection(socket);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n======================================================`);
  console.log(` TogetherTube Standalone Realtime Server is LIVE!`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` WebSocket: ws://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log(` (Zero external dependencies needed!)`);
  console.log(`======================================================\n`);
});
