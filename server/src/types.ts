export type AvatarTone = "violet" | "blue" | "mint" | "amber" | "rose";
export type PresenceStatus = "online" | "away" | "offline";

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  status: PresenceStatus;
  tone: AvatarTone;
  socketId?: string;
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
  positionSec: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderTone: AvatarTone;
  text: string;
  timestamp: number;
}

export interface ServerRoom {
  code: string;
  name: string;
  inviteLink: string;
  hostId: string;
  participants: Participant[];
  video: VideoInfo | null;
  playback: PlaybackState;
  createdAt: number;
  chatHistory: ChatMessage[];
}

export interface RoomPreview {
  code: string;
  name: string;
  hostName: string;
  participantCount: number;
  video: VideoInfo | null;
}

export type WebRTCSignal =
  | { type: "offer"; to: string; from: string; sdp: RTCSessionDescriptionInit; fromName: string }
  | { type: "answer"; to: string; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; to: string; from: string; candidate: RTCIceCandidateInit };
