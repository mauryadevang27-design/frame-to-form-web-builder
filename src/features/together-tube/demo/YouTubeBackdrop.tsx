import type { VideoInfo } from "../types";

/** Dimmed stand-in for the YouTube tab the extension sits on top of. */
export function YouTubeBackdrop({ video }: { video: VideoInfo }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 hidden select-none p-6 opacity-25 md:flex md:gap-6"
      aria-hidden
    >
      <div className="min-w-0 flex-1">
        <div className="overflow-hidden rounded-xl bg-muted">
          <img
            src={video.thumbnailUrl}
            alt=""
            className="aspect-video w-full object-cover opacity-70"
          />
        </div>
        <p className="mt-4 text-lg font-semibold text-foreground">{video.title}</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="size-9 rounded-full bg-surface-raised" />
          <div>
            <p className="text-sm text-foreground">{video.channel}</p>
            <div className="mt-1 h-2 w-24 rounded bg-surface-raised" />
          </div>
        </div>
      </div>
      <div className="hidden w-[300px] shrink-0 space-y-3 xl:block">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="aspect-video w-36 rounded-lg bg-surface-raised" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-2.5 rounded bg-surface-raised" />
              <div className="h-2.5 w-2/3 rounded bg-surface-raised" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
