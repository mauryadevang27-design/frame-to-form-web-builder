import { ExternalLink, Pause, Play, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNow } from "../hooks/use-now";
import { currentPosition } from "../lib/playback";
import { formatTimestamp, youTubeWatchUrl } from "../lib/youtube";
import type { PlaybackState, VideoInfo } from "../types";
import { StateView } from "./StateView";

interface VideoPreviewProps {
  video: VideoInfo | null;
  playback: PlaybackState;
  onOpenYouTube?: ((url: string) => void) | undefined;
}

export function VideoPreview({ video, playback, onOpenYouTube }: VideoPreviewProps) {
  const now = useNow(playback.isPlaying && !!video);
  const open = (url: string) =>
    onOpenYouTube ? onOpenYouTube(url) : window.open(url, "_blank", "noopener");

  if (!video) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-surface px-4 py-5">
        <StateView
          icon={<Youtube />}
          tone="muted"
          title="No YouTube video detected"
          description="Open a YouTube video in this tab and TogetherTube will pick it up automatically."
        >
          <Button
            variant="surface"
            size="sm"
            className="mx-auto h-8 rounded-lg"
            onClick={() => open("https://www.youtube.com")}
          >
            <ExternalLink /> Open YouTube
          </Button>
        </StateView>
      </div>
    );
  }

  const position = currentPosition(playback, video.durationSec, now);
  const pct = video.durationSec ? (position / video.durationSec) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={video.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
        <span
          className={cn(
            "absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-background/75 px-1.5 py-0.5 text-[10.5px] font-medium backdrop-blur-md",
            playback.isPlaying ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {playback.isPlaying ? (
            <Play className="size-3 fill-current" />
          ) : (
            <Pause className="size-3 fill-current" />
          )}
          {playback.isPlaying ? "Playing" : "Paused"}
        </span>
        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-background/75 px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground backdrop-blur-md">
          <Youtube className="size-3 text-youtube" /> YouTube
        </span>
        <div className="absolute inset-x-2.5 bottom-2 flex items-center gap-2">
          <span className="font-mono text-[10.5px] tabular-nums text-foreground">
            {formatTimestamp(position)}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/20">
            <div
              className="h-full rounded-full bg-gradient-primary transition-[width] duration-500 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
            {formatTimestamp(video.durationSec)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-foreground" title={video.title}>
            {video.title}
          </p>
          <p className="truncate text-[11.5px] text-muted-foreground">{video.channel}</p>
        </div>
        <Button
          variant="surface"
          size="sm"
          className="h-8 shrink-0 rounded-lg"
          onClick={() => open(youTubeWatchUrl(video.id, position))}
        >
          <ExternalLink /> Open on YouTube
        </Button>
      </div>
    </div>
  );
}
