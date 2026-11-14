import type { Server, Socket } from "socket.io";
import { RoomManager } from "./room-manager.js";
import type { ChatMessage, Participant, PlaybackState, VideoInfo, WebRTCSignal } from "./types.js";

export function registerSocketHandlers(io: Server, roomManager: RoomManager) {
  io.on("connection", (socket: Socket) => {
    // 1. Room Creation
    socket.on(
      "room:create",
      (
        data: {
          host: Omit<Participant, "isHost">;
          name?: string;
          video?: VideoInfo | null;
        },
        callback: (res: { ok: boolean; room?: unknown; error?: string }) => void,
      ) => {
        try {
          const room = roomManager.createRoom(data.host, data.name, data.video, socket.id);
          socket.join(room.code);
          callback({ ok: true, room });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to create room";
          callback({ ok: false, error: message });
        }
      },
    );

    // 2. Room Preview
    socket.on("room:preview", (code: string, callback: (res: { ok: boolean; preview?: unknown; error?: string }) => void) => {
      const preview = roomManager.getRoomPreview(code);
      if (!preview) {
        return callback({ ok: false, error: "Room not found" });
      }
      callback({ ok: true, preview });
    });

    // 3. Room Join
    socket.on(
      "room:join",
      (
        data: { code: string; participant: Omit<Participant, "isHost"> },
        callback: (res: {
          ok: boolean;
          room?: unknown;
          currentPositionSec?: number;
          chatHistory?: unknown[];
          error?: string;
        }) => void,
      ) => {
        const result = roomManager.joinRoom(data.code, data.participant, socket.id);
        if (!result) {
          return callback({ ok: false, error: "Room not found or ended" });
        }

        const { room, isNew } = result;
        socket.join(room.code);

        // Notify other room participants
        const joinedParticipant = room.participants.find((p) => p.id === data.participant.id);
        if (joinedParticipant && isNew) {
          socket.to(room.code).emit("participant_joined", { participant: joinedParticipant });
        }

        // Compute late-joiner timestamp
        const currentPositionSec = roomManager.getComputedPlaybackPosition(room);
        const chatHistory = roomManager.getChatHistory(room.code);

        callback({
          ok: true,
          room,
          currentPositionSec,
          chatHistory,
        });
      },
    );

    // 4. Playback Synchronization (Host to Guests)
    socket.on(
      "playback:update",
      (
        data: { code: string; playback: PlaybackState; requesterId: string },
        callback?: (res: { ok: boolean; error?: string }) => void,
      ) => {
        const room = roomManager.updatePlayback(data.code, data.playback, data.requesterId);
        if (!room) {
          callback?.({ ok: false, error: "Unauthorized or room not found" });
          return;
        }

        // Broadcast synchronized playback to all guests in the room
        socket.to(room.code).emit("playback:sync", { playback: room.playback });
        callback?.({ ok: true });
      },
    );

    // 5. Video Changed (Host updates video URL)
    socket.on(
      "video:update",
      (
        data: { code: string; video: VideoInfo | null; requesterId: string },
        callback?: (res: { ok: boolean; error?: string }) => void,
      ) => {
        const room = roomManager.updateVideo(data.code, data.video, data.requesterId);
        if (!room) {
          callback?.({ ok: false, error: "Unauthorized or room not found" });
          return;
        }

        io.to(room.code).emit("video_changed", { video: room.video });
        callback?.({ ok: true });
      },
    );

    // 6. Real-time Room Chat
    socket.on(
      "chat:send",
      (
        data: {
          code: string;
          senderId: string;
          senderName: string;
          senderTone: Participant["tone"];
          text: string;
        },
        callback?: (res: { ok: boolean; message?: ChatMessage; error?: string }) => void,
      ) => {
        const text = data.text?.trim();
        if (!text) {
          callback?.({ ok: false, error: "Empty message" });
          return;
        }

        const message: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          senderId: data.senderId,
          senderName: data.senderName,
          senderTone: data.senderTone,
          text,
          timestamp: Date.now(),
        };

        const stored = roomManager.addChatMessage(data.code, message);
        if (!stored) {
          callback?.({ ok: false, error: "Room not found" });
          return;
        }

        io.to(data.code).emit("chat:message", message);
        callback?.({ ok: true, message });
      },
    );

    // 7. WebRTC Signaling Relay
    socket.on("webrtc:signal", (signal: WebRTCSignal & { code: string }) => {
      const room = roomManager.getRoom(signal.code);
      if (!room) return;

      const target = room.participants.find((p) => p.id === signal.to);
      if (target?.socketId) {
        io.to(target.socketId).emit("webrtc:signal", signal);
      }
    });

    // 8. Room End (Host only)
    socket.on(
      "room:end",
      (
        data: { code: string; requesterId: string },
        callback?: (res: { ok: boolean; error?: string }) => void,
      ) => {
        const ended = roomManager.endRoom(data.code, data.requesterId);
        if (!ended) {
          callback?.({ ok: false, error: "Unauthorized or room not found" });
          return;
        }

        io.to(data.code).emit("room_ended");
        callback?.({ ok: true });
      },
    );

    // 9. Client Disconnection Handling
    socket.on("disconnect", () => {
      const left = roomManager.leaveRoom(socket.id);
      if (!left) return;

      const { room, participant, roomEnded } = left;
      if (roomEnded) {
        io.to(room.code).emit("room_ended");
      } else {
        socket.to(room.code).emit("participant_left", { participantId: participant.id });
        if (participant.isHost) {
          socket.to(room.code).emit("host_presence", { online: false });
        }
      }
    });
  });
}
