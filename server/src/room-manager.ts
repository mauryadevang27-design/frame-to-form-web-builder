import type {
  ChatMessage,
  Participant,
  PlaybackState,
  RoomPreview,
  ServerRoom,
  VideoInfo,
} from "./types.js";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 6;
const MAX_CHAT_HISTORY = 100;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

export class RoomManager {
  private rooms = new Map<string, ServerRoom>();
  private socketMap = new Map<string, { code: string; participantId: string }>();

  public createRoom(
    host: Omit<Participant, "isHost">,
    name?: string,
    video?: VideoInfo | null,
    socketId?: string,
  ): ServerRoom {
    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const hostParticipant: Participant = {
      ...host,
      isHost: true,
      status: "online",
      socketId,
    };

    const room: ServerRoom = {
      code,
      name: name?.trim() || `${host.name}'s room`,
      inviteLink: `https://togethertube.app/join/${code}`,
      hostId: host.id,
      participants: [hostParticipant],
      video: video ?? null,
      playback: {
        isPlaying: false,
        positionSec: 0,
        updatedAt: Date.now(),
      },
      createdAt: Date.now(),
      chatHistory: [],
    };

    this.rooms.set(code, room);
    if (socketId) {
      this.socketMap.set(socketId, { code, participantId: host.id });
    }

    return room;
  }

  public getRoom(code: string): ServerRoom | undefined {
    return this.rooms.get(code.toUpperCase().replace(/[\s-]/g, ""));
  }

  public getRoomPreview(code: string): RoomPreview | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const host = room.participants.find((p) => p.id === room.hostId);
    return {
      code: room.code,
      name: room.name,
      hostName: host?.name ?? "Host",
      participantCount: room.participants.filter((p) => p.status === "online").length,
      video: room.video,
    };
  }

  public joinRoom(
    code: string,
    guest: Omit<Participant, "isHost">,
    socketId?: string,
  ): { room: ServerRoom; isNew: boolean } | null {
    const room = this.getRoom(code);
    if (!room) return null;

    const existingIdx = room.participants.findIndex((p) => p.id === guest.id);
    let isNew = false;

    if (existingIdx !== -1) {
      // Re-joining or updating socket
      const existing = room.participants[existingIdx];
      if (existing) {
        existing.status = "online";
        existing.name = guest.name;
        existing.socketId = socketId;
      }
    } else {
      isNew = true;
      room.participants.push({
        ...guest,
        isHost: false,
        status: "online",
        socketId,
      });
    }

    if (socketId) {
      this.socketMap.set(socketId, { code: room.code, participantId: guest.id });
    }

    return { room, isNew };
  }

  public leaveRoom(socketId: string): {
    room: ServerRoom;
    participant: Participant;
    roomEnded: boolean;
  } | null {
    const meta = this.socketMap.get(socketId);
    if (!meta) return null;

    this.socketMap.delete(socketId);
    const room = this.rooms.get(meta.code);
    if (!room) return null;

    const pIdx = room.participants.findIndex((p) => p.id === meta.participantId);
    if (pIdx === -1) return null;

    const participant = room.participants[pIdx];
    if (!participant) return null;

    participant.status = "offline";

    // If host leaves, check if there are other participants
    let roomEnded = false;
    const remainingOnline = room.participants.filter((p) => p.status === "online");

    if (participant.isHost) {
      if (remainingOnline.length === 0) {
        // No one left, close room
        this.rooms.delete(room.code);
        roomEnded = true;
      } else {
        // Pause playback when host disconnects
        if (room.playback.isPlaying) {
          const elapsed = (Date.now() - room.playback.updatedAt) / 1000;
          room.playback.positionSec += elapsed;
          room.playback.isPlaying = false;
          room.playback.updatedAt = Date.now();
        }
      }
    }

    return { room, participant, roomEnded };
  }

  public endRoom(code: string, requesterId: string): boolean {
    const room = this.getRoom(code);
    if (!room || room.hostId !== requesterId) return false;

    // Clean socket map for this room
    for (const p of room.participants) {
      if (p.socketId) {
        this.socketMap.delete(p.socketId);
      }
    }

    this.rooms.delete(room.code);
    return true;
  }

  public updatePlayback(
    code: string,
    playback: PlaybackState,
    requesterId: string,
  ): ServerRoom | null {
    const room = this.getRoom(code);
    if (!room) return null;

    // Only host can update playback
    if (room.hostId !== requesterId) return null;

    room.playback = {
      isPlaying: playback.isPlaying,
      positionSec: Math.max(0, playback.positionSec),
      updatedAt: playback.updatedAt || Date.now(),
    };

    return room;
  }

  public updateVideo(code: string, video: VideoInfo | null, requesterId: string): ServerRoom | null {
    const room = this.getRoom(code);
    if (!room || room.hostId !== requesterId) return null;

    room.video = video;
    room.playback = {
      isPlaying: false,
      positionSec: 0,
      updatedAt: Date.now(),
    };

    return room;
  }

  public getComputedPlaybackPosition(room: ServerRoom): number {
    if (!room.playback.isPlaying) return room.playback.positionSec;
    const elapsed = (Date.now() - room.playback.updatedAt) / 1000;
    const computed = room.playback.positionSec + elapsed;
    if (room.video && room.video.durationSec > 0) {
      return Math.min(room.video.durationSec, computed);
    }
    return computed;
  }

  public addChatMessage(code: string, message: ChatMessage): ChatMessage | null {
    const room = this.getRoom(code);
    if (!room) return null;

    room.chatHistory.push(message);
    if (room.chatHistory.length > MAX_CHAT_HISTORY) {
      room.chatHistory.shift();
    }

    return message;
  }

  public getChatHistory(code: string): ChatMessage[] {
    const room = this.getRoom(code);
    return room ? [...room.chatHistory] : [];
  }

  public getSocketInfo(socketId: string) {
    return this.socketMap.get(socketId);
  }

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }
}
