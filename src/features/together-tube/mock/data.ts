/** Mock fixtures for the UI prototype. Nothing here is used by a real transport. */
import type { Participant, VideoInfo } from "../types";
import { youTubeThumbnail, youTubeWatchUrl } from "../lib/youtube";

export const SELF_ID = "self";

export const DEMO_VIDEO: VideoInfo = {
  id: "aqz-KE-bpKQ",
  title: "Big Buck Bunny 60fps 4K — Official Blender Foundation Short Film",
  channel: "Blender",
  durationSec: 635,
  thumbnailUrl: youTubeThumbnail("aqz-KE-bpKQ"),
  url: youTubeWatchUrl("aqz-KE-bpKQ"),
};

export const SPRING_VIDEO: VideoInfo = {
  id: "WhWc3b3KhnY",
  title: "Spring — Blender Open Movie",
  channel: "Blender",
  durationSec: 464,
  thumbnailUrl: youTubeThumbnail("WhWc3b3KhnY"),
  url: youTubeWatchUrl("WhWc3b3KhnY"),
};

export const MOCK_GUESTS: Participant[] = [
  { id: "p-alex", name: "Alex", isHost: false, status: "online", tone: "blue" },
  { id: "p-sarah", name: "Sarah", isHost: false, status: "online", tone: "mint" },
];

export const LATE_JOINERS: Participant[] = [
  { id: "p-maya", name: "Maya", isHost: false, status: "online", tone: "amber" },
  { id: "p-jordan", name: "Jordan", isHost: false, status: "online", tone: "rose" },
  { id: "p-kenji", name: "Kenji", isHost: false, status: "online", tone: "blue" },
];

/** Rooms that "exist" on the mock server, keyed by code. */
export const MOCK_DIRECTORY: Record<
  string,
  {
    name: string;
    host: Participant;
    guests: Participant[];
    video: VideoInfo | null;
    positionSec: number;
  }
> = {
  K7M4QX: {
    name: "Friday Movie Night",
    host: { id: "p-sarah", name: "Sarah", isHost: true, status: "online", tone: "mint" },
    guests: [{ id: "p-alex", name: "Alex", isHost: false, status: "online", tone: "blue" }],
    video: DEMO_VIDEO,
    positionSec: 142,
  },
  PRN8TV: {
    name: "Study break",
    host: { id: "p-maya", name: "Maya", isHost: true, status: "online", tone: "amber" },
    guests: [],
    video: SPRING_VIDEO,
    positionSec: 38,
  },
};

/** Codes reserved to demo the "room ended" error. */
export const ENDED_CODES = new Set(["END3D2"]);
