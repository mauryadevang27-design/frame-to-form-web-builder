import type { PlaybackState, Room, RoomEvent, RoomPreview } from "../types";

export interface CreateRoomInput {
  name?: string | undefined;
  videoUrl?: string | undefined;
  displayName: string;
}

/**
 * Contract the UI depends on. The mock implementation simulates latency;
 * a Socket.IO-backed implementation (via the extension's service worker)
 * can replace it without touching any screen or component.
 */
export interface RoomService {
  createRoom(input: CreateRoomInput): Promise<Room>;
  previewRoom(code: string): Promise<RoomPreview>;
  joinRoom(code: string, displayName: string): Promise<Room>;
  leaveRoom(code: string): Promise<void>;
  endRoom(code: string): Promise<void>;
  /** Host only: broadcast play/pause/seek. */
  updatePlayback(code: string, playback: PlaybackState): Promise<void>;
  /** Live room events (presence, playback, connection). Returns an unsubscribe fn. */
  subscribe(code: string, listener: (event: RoomEvent) => void): () => void;
}
