const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Extracts the 11-char video id from common YouTube URL shapes, or null. */
export function parseYouTubeVideoId(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\.|^music\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0] ?? null;
  } else if (host === "youtube.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/);
      id = m?.[1] ?? null;
    }
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

export function youTubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youTubeWatchUrl(id: string, atSec?: number): string {
  const t = atSec && atSec > 0 ? `&t=${Math.floor(atSec)}s` : "";
  return `https://www.youtube.com/watch?v=${id}${t}`;
}

/** 75 -> "1:15", 3725 -> "1:02:05" */
export function formatTimestamp(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
