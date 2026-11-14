import type { PlaybackState } from "../types";

/** Current position derived from the last host update, clamped to the video length. */
export function currentPosition(playback: PlaybackState, durationSec: number, now = Date.now()) {
  const elapsed = playback.isPlaying ? (now - playback.updatedAt) / 1000 : 0;
  return Math.min(durationSec, Math.max(0, playback.positionSec + elapsed));
}
