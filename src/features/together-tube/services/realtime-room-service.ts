import { buildInviteLink, generateRoomCode } from "../lib/room-code";
import { parseYouTubeVideoId, youTubeThumbnail, youTubeWatchUrl } from "../lib/youtube";
import { DEMO_VIDEO, SELF_ID } from "../mock/data";
import {
  type AvatarTone,
  type ChatMessage,
  type PlaybackState,
  type Room,
  type RoomError,
  type RoomEvent,
  type RoomPreview,
  type VideoInfo,
} from "../types";
import type { CreateRoomInput, RoomService } from "./room-service";

export interface RealtimeRoomServiceOptions {
  serverUrl?: string;
  userId?: string;
  userTone?: AvatarTone;
}

export class RealtimeRoomService implements RoomService {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private userId: string;
  private userTone: AvatarTone;
  private pendingRequests = new Map<
    string,
    { resolve: (val: any) => void; reject: (err: any) => void; timer: NodeJS.Timeout }
  >();
  private listeners = new Set<(event: RoomEvent) => void>();
  private signalListeners = new Set<(signal: any) => void>();
  private currentRoomCode: string | null = null;
  private chatHistory: ChatMessage[] = [];
  private isConnecting = false;
  private hasConnected = false;

  constructor(options: RealtimeRoomServiceOptions = {}) {
    this.serverUrl = options.serverUrl || "ws://localhost:3001";
    this.userId =
      options.userId ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("togethertube_user_id") || this.initUserId()
        : SELF_ID);
    this.userTone = options.userTone || "violet";
    this.connect();
  }

  private initUserId(): string {
    const id = "u_" + Math.random().toString(36).slice(2, 9);
    try {
      localStorage.setItem("togethertube_user_id", id);
    } catch {}
    return id;
  }

  public getUserId(): string {
    return this.userId;
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.hasConnected = true;
        this.emit({ type: "connection", state: "connected" });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error("[RealtimeService] Error parsing message:", e);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.emit({ type: "connection", state: "lost" });
        // Attempt reconnect after 3 seconds
        setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        if (!this.hasConnected) {
          // If local server isn't running yet, don't crash
          this.emit({ type: "connection", state: "lost" });
        }
      };
    } catch (err) {
      this.isConnecting = false;
      this.emit({ type: "connection", state: "lost" });
    }
  }

  private handleServerMessage(msg: any) {
    if (msg.type === "response" && msg.requestId) {
      const pending = this.pendingRequests.get(msg.requestId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(msg.requestId);
        if (msg.payload?.ok) {
          pending.resolve(msg.payload);
        } else {
          pending.reject(new Error(msg.payload?.error || "Request failed"));
        }
      }
      return;
    }

    if (msg.type === "event" && msg.event) {
      this.emit(msg.event);
      return;
    }

    if (msg.type === "chat:message" && msg.message) {
      this.chatHistory.push(msg.message);
      this.emit({ type: "chat_message", message: msg.message });
      return;
    }

    if (msg.type === "webrtc:signal" && msg.signal) {
      for (const listener of this.signalListeners) {
        listener(msg.signal);
      }
      return;
    }
  }

  private request<T>(type: string, payload: any, timeoutMs = 8000): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.connect();
        // Give 1.5s to establish connection
        setTimeout(() => {
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            reject(new Error("Server offline. Please run: npm run server"));
            return;
          }
          this.doRequest(type, payload, timeoutMs, resolve, reject);
        }, 1200);
        return;
      }

      this.doRequest(type, payload, timeoutMs, resolve, reject);
    });
  }

  private doRequest(
    type: string,
    payload: any,
    timeoutMs: number,
    resolve: (val: any) => void,
    reject: (err: any) => void,
  ) {
    const requestId = "req_" + Math.random().toString(36).slice(2, 9);
    const timer = setTimeout(() => {
      this.pendingRequests.delete(requestId);
      reject(new Error("Request timed out"));
    }, timeoutMs);

    this.pendingRequests.set(requestId, { resolve, reject, timer });
    this.ws!.send(JSON.stringify({ type, requestId, payload }));
  }

  private send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  private emit(event: RoomEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private parseVideo(url?: string): VideoInfo {
    const id = url ? parseYouTubeVideoId(url) : null;
    if (!id) return DEMO_VIDEO;
    return {
      id,
      title: "YouTube Video",
      channel: "Detected Video",
      durationSec: 600,
      thumbnailUrl: youTubeThumbnail(id),
      url: youTubeWatchUrl(id),
    };
  }

  // --- RoomService Implementation ---

  public async createRoom(input: CreateRoomInput): Promise<Room> {
    try {
      const res: any = await this.request("room:create", {
        host: { id: this.userId, name: input.displayName, tone: this.userTone },
        name: input.name,
        video: this.parseVideo(input.videoUrl),
      });
      this.currentRoomCode = res.room.code;
      this.chatHistory = [];
      return res.room;
    } catch {
      // Local fallback if server isn't running yet
      const code = generateRoomCode();
      this.currentRoomCode = code;
      return {
        code,
        name: input.name?.trim() || `${input.displayName}'s Room`,
        inviteLink: buildInviteLink(code),
        hostId: this.userId,
        participants: [
          { id: this.userId, name: input.displayName, isHost: true, status: "online", tone: this.userTone },
        ],
        video: this.parseVideo(input.videoUrl),
        playback: { isPlaying: false, positionSec: 0, updatedAt: Date.now() },
        createdAt: Date.now(),
      };
    }
  }

  public async previewRoom(code: string): Promise<RoomPreview> {
    try {
      const res: any = await this.request("room:preview", { code });
      return res.preview;
    } catch {
      return {
        code,
        name: "Watch Party Room",
        hostName: "Host",
        participantCount: 1,
        video: DEMO_VIDEO,
      };
    }
  }

  public async joinRoom(code: string, displayName: string): Promise<Room> {
    try {
      const res: any = await this.request("room:join", {
        code,
        participant: { id: this.userId, name: displayName, tone: "blue" },
      });
      this.currentRoomCode = res.room.code;
      this.chatHistory = res.chatHistory || [];
      return res.room;
    } catch {
      this.currentRoomCode = code;
      return {
        code,
        name: "Watch Party Room",
        inviteLink: buildInviteLink(code),
        hostId: "host_id",
        participants: [
          { id: "host_id", name: "Host", isHost: true, status: "online", tone: "violet" },
          { id: this.userId, name: displayName, isHost: false, status: "online", tone: "blue" },
        ],
        video: DEMO_VIDEO,
        playback: { isPlaying: false, positionSec: 0, updatedAt: Date.now() },
        createdAt: Date.now(),
      };
    }
  }

  public async leaveRoom(code: string): Promise<void> {
    this.send("room:leave", { code });
    this.currentRoomCode = null;
  }

  public async endRoom(code: string): Promise<void> {
    this.send("room:end", { code, requesterId: this.userId });
    this.currentRoomCode = null;
  }

  public async updatePlayback(code: string, playback: PlaybackState): Promise<void> {
    this.send("playback:update", { code, playback, requesterId: this.userId });
  }

  public async updateVideo(code: string, video: VideoInfo | null): Promise<void> {
    this.send("video:update", { code, video, requesterId: this.userId });
  }

  public async sendChat(text: string): Promise<void> {
    if (!this.currentRoomCode) return;
    try {
      await this.request("chat:send", { code: this.currentRoomCode, text });
    } catch {
      // Local preview fallback
      const msg: ChatMessage = {
        id: "msg_" + Date.now(),
        senderId: this.userId,
        senderName: "You",
        senderTone: this.userTone,
        text,
        timestamp: Date.now(),
      };
      this.chatHistory.push(msg);
      this.emit({ type: "chat_message", message: msg });
    }
  }

  public getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  public sendSignal(signal: any) {
    if (!this.currentRoomCode) return;
    this.send("webrtc:signal", { ...signal, code: this.currentRoomCode });
  }

  public onSignal(listener: (signal: any) => void): () => void {
    this.signalListeners.add(listener);
    return () => this.signalListeners.delete(listener);
  }

  public subscribe(code: string, listener: (event: RoomEvent) => void): () => void {
    this.currentRoomCode = code;
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export function createRealtimeRoomService(options?: RealtimeRoomServiceOptions): RealtimeRoomService {
  return new RealtimeRoomService(options);
}
