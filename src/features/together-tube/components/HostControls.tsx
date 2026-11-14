import { Crown, Lock, Pause, Play, RotateCcw, RotateCw, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConnectionState } from "../types";
import { StatusDot } from "./StatusDot";

function SyncLine({ connection, label }: { connection: ConnectionState; label: string }) {
  const ok = connection === "connected";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11.5px]",
        ok ? "text-success" : "text-warning",
      )}
    >
      <StatusDot status={ok ? "online" : "warning"} pulse={ok} />
      {ok ? label : "Waiting for connection…"}
    </span>
  );
}

interface HostControlsProps {
  isPlaying: boolean;
  connection: ConnectionState;
  watcherCount: number;
  disabled?: boolean | undefined;
  onTogglePlay: () => void;
  onSeek: (deltaSec: number) => void;
}

/** Only rendered for the host. */
export function HostControls({
  isPlaying,
  connection,
  watcherCount,
  disabled,
  onTogglePlay,
  onSeek,
}: HostControlsProps) {
  const off = disabled || connection !== "connected";
  return (
    <section className="rounded-xl border border-primary/20 bg-gradient-surface bg-surface p-3 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-primary">
          <Crown className="size-3.5" /> Host controls
        </span>
        <SyncLine
          connection={connection}
          label={watcherCount > 1 ? `${watcherCount} in sync` : "Ready to sync"}
        />
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="quiet"
          size="icon"
          className="rounded-full"
          disabled={off}
          onClick={() => onSeek(-10)}
          aria-label="Back 10 seconds"
        >
          <RotateCcw />
        </Button>
        <Button
          variant="primary"
          className="size-12 rounded-full [&_svg]:size-5"
          disabled={off}
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Pause for everyone" : "Play for everyone"}
        >
          {isPlaying ? (
            <Pause className="fill-current" />
          ) : (
            <Play className="ml-0.5 fill-current" />
          )}
        </Button>
        <Button
          variant="quiet"
          size="icon"
          className="rounded-full"
          disabled={off}
          onClick={() => onSeek(10)}
          aria-label="Forward 10 seconds"
        >
          <RotateCw />
        </Button>
      </div>
      <p className="mt-2.5 text-center text-[11px] text-subtle-foreground">
        {isPlaying
          ? "Pausing here pauses it for everyone."
          : "Press play to start the video for everyone."}
      </p>
    </section>
  );
}

/** What guests see instead of controls. */
export function GuestPlaybackStatus({
  hostName,
  hostOnline,
  connection,
}: {
  hostName: string;
  hostOnline: boolean;
  connection: ConnectionState;
}) {
  if (!hostOnline) {
    return (
      <section className="flex items-start gap-2.5 rounded-xl border border-warning/20 bg-warning/10 p-3 animate-rise-in">
        <UserX className="mt-0.5 size-4 shrink-0 text-warning" />
        <div>
          <p className="text-[12.5px] font-medium text-foreground">{hostName} disconnected</p>
          <p className="text-[11.5px] text-muted-foreground">
            Playback is paused. It'll resume when the host is back.
          </p>
        </div>
      </section>
    );
  }
  return (
    <section className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3 shadow-card">
      <span className="flex size-8 items-center justify-center rounded-lg bg-surface-raised text-muted-foreground">
        <Lock className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-foreground">
          Playback is controlled by the host.
        </p>
        <SyncLine connection={connection} label={`Synced with ${hostName}`} />
      </div>
    </section>
  );
}
