import { buildInviteLink, generateRoomCode } from "../lib/room-code";
import { parseYouTubeVideoId, youTubeThumbnail, youTubeWatchUrl } from "../lib/youtube";
import { DEMO_VIDEO, ENDED_CODES, MOCK_DIRECTORY, MOCK_GUESTS, SELF_ID } from "../mock/data";
import { RoomError, type Room, type VideoInfo } from "../types";
import type { RoomService } from "./room-service";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function videoFromUrl(url?: string): VideoInfo {
  const id = url ? parseYouTubeVideoId(url) : null;
  if (!id || id === DEMO_VIDEO.id) return DEMO_VIDEO;
  // Real metadata comes from the YouTube content script later.
  return {
    id,
    title: "YouTube video",
    channel: "Detected from your link",
    durationSec: 600,
    thumbnailUrl: youTubeThumbnail(id),
    url: youTubeWatchUrl(id),
  };
}

export function createMockRoomService(latencyMs = 1100): RoomService {
  return {
    async createRoom({ name, videoUrl, displayName }) {
      await wait(latencyMs);
      const code = generateRoomCode();
      return {
        code,
        name: name?.trim() || `${displayName}'s room`,
        inviteLink: buildInviteLink(code),
        hostId: SELF_ID,
        participants: [
          { id: SELF_ID, name: displayName, isHost: true, status: "online", tone: "violet" },
        ],
        video: videoFromUrl(videoUrl),
        playback: { isPlaying: false, positionSec: 0, updatedAt: Date.now() },
        createdAt: Date.now(),
      } satisfies Room;
    },

    async previewRoom(code) {
      await wait(latencyMs * 0.6);
      if (ENDED_CODES.has(code)) throw new RoomError("ended");
      const entry = MOCK_DIRECTORY[code];
      if (!entry) throw new RoomError("not_found");
      return {
        code,
        name: entry.name,
        hostName: entry.host.name,
        participantCount: entry.guests.length + 1,
        video: entry.video,
      };
    },

    async joinRoom(code, displayName) {
      await wait(latencyMs);
      if (ENDED_CODES.has(code)) throw new RoomError("ended");
      const entry = MOCK_DIRECTORY[code];
      if (!entry) throw new RoomError("not_found");
      return {
        code,
        name: entry.name,
        inviteLink: buildInviteLink(code),
        hostId: entry.host.id,
        participants: [
          entry.host,
          ...entry.guests,
          { id: SELF_ID, name: displayName, isHost: false, status: "online", tone: "violet" },
        ],
        video: entry.video,
        playback: { isPlaying: true, positionSec: entry.positionSec, updatedAt: Date.now() },
        createdAt: Date.now(),
      };
    },

    async leaveRoom() {
      await wait(350);
    },
    async endRoom() {
      await wait(500);
    },
    async updatePlayback() {
      await wait(0);
    },

    subscribe(code, listener) {
      // Prototype only: in rooms you host, the sample guests arrive a few seconds
      // after creation so the "waiting" and "joined" states are visible.
      if (MOCK_DIRECTORY[code]) return () => {};
      const timers = MOCK_GUESTS.map((guest, i) =>
        setTimeout(
          () => listener({ type: "participant_joined", participant: guest }),
          3500 + i * 2600,
        ),
      );
      return () => timers.forEach(clearTimeout);
    },
  };
}
