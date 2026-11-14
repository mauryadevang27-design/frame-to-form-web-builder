import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConnectionState } from "../types";
import { StatusDot, type StatusTone } from "./StatusDot";
import { Spinner } from "./Spinner";

const meta: Record<ConnectionState, { label: string; tone: StatusTone }> = {
  connected: { label: "Live", tone: "online" },
  connecting: { label: "Connecting", tone: "warning" },
  reconnecting: { label: "Reconnecting", tone: "warning" },
  lost: { label: "Offline", tone: "offline" },
};

/** Compact pill used in headers. */
export function ConnectionStatus({
  state,
  className,
}: {
  state: ConnectionState;
  className?: string;
}) {
  const m = meta[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium",
        state === "connected"
          ? "text-success"
          : state === "lost"
            ? "text-destructive"
            : "text-warning",
        className,
      )}
    >
      <StatusDot status={m.tone} pulse={state !== "lost"} />
      {m.label}
    </span>
  );
}

/** Inline banner for non-connected states inside the room. */
export function ConnectionBanner({
  state,
  onRetry,
}: {
  state: ConnectionState;
  onRetry: () => void;
}) {
  if (state === "connected") return null;
  const lost = state === "lost";
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 animate-rise-in",
        lost ? "border-destructive/25 bg-destructive/10" : "border-warning/20 bg-warning/10",
      )}
      role="status"
    >
      {lost ? (
        <WifiOff className="size-4 shrink-0 text-destructive" />
      ) : (
        <Spinner className="text-warning" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-foreground">
          {state === "connecting" && "Connecting to sync server…"}
          {state === "reconnecting" && "Reconnecting…"}
          {lost && "Connection lost"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {lost
            ? "Playback won't stay in sync until you're back."
            : "Hang tight, this usually takes a second."}
        </p>
      </div>
      {lost && (
        <Button variant="surface" size="sm" onClick={onRetry} className="h-7 rounded-lg">
          <RefreshCw /> Retry
        </Button>
      )}
    </div>
  );
}
