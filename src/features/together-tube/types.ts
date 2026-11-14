/**
 * Domain types shared by the UI and any room service implementation
 * (mock today, Socket.IO client later). Keep these transport-agnostic.
 */

export type AvatarTone = "violet" | "blue" | "mint" | "amber" | "rose";

export type PresenceStatus = "online" | "away" | "offline";

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  status: PresenceStatus;
  tone: AvatarTone;
}

export interface VideoInfo {
  id: string;
  title: string;
  channel: string;
  durationSec: number;
  thumbnailUrl: string;
  url: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  /** Position at the moment `updatedAt` was recorded. */
  positionSec: number;
  /** Epoch ms when this state was produced by the host. */
  updatedAt: number;
}

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "lost";

export interface Room {
  code: string;
  name: string;
  inviteLink: string;
  hostId: string;
  participants: Participant[];
  video: VideoInfo | null;
  playback: PlaybackState;
  createdAt: number;
}

/** Lightweight info shown before joining from an invitation link. */
export interface RoomPreview {
  code: string;
  name: string;
  hostName: string;
  participantCount: number;
  video: VideoInfo | null;
}

export type RoomErrorKind = "not_found" | "ended" | "network";

export class RoomError extends Error {
  constructor(
    public kind: RoomErrorKind,
    message?: string,
  ) {
    super(message ?? kind);
    this.name = "RoomError";
  }
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderTone: AvatarTone;
  text: string;
  timestamp: number;
}

/**
 * Events a live transport pushes into the session. The prototype controls emit
 * the same events so the UI reacts identically once a real server exists.
 */
export type RoomEvent =
  | { type: "participant_joined"; participant: Participant }
  | { type: "participant_left"; participantId: string }
  | { type: "connection"; state: ConnectionState }
  | { type: "host_presence"; online: boolean }
  | { type: "video_changed"; video: VideoInfo | null }
  | { type: "playback"; playback: PlaybackState }
  | { type: "chat_message"; message: ChatMessage }
  | { type: "room_ended" };

export type Screen = "home" | "create" | "join" | "invite" | "room" | "settings" | "ended";
