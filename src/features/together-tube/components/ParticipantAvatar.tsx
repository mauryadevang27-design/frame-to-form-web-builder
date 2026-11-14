import { cn } from "@/lib/utils";
import type { AvatarTone, PresenceStatus } from "../types";
import { StatusDot } from "./StatusDot";

const tones: Record<AvatarTone, string> = {
  violet: "bg-chart-1/20 text-chart-1",
  blue: "bg-chart-2/20 text-chart-2",
  mint: "bg-chart-3/20 text-chart-3",
  amber: "bg-chart-4/20 text-chart-4",
  rose: "bg-chart-5/20 text-chart-5",
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function ParticipantAvatar({
  name,
  tone,
  status,
  size = "md",
  className,
}: {
  name: string;
  tone: AvatarTone;
  status?: PresenceStatus | undefined;
  size?: "sm" | "md" | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-background",
        size === "md" ? "size-8 text-[11px]" : "size-6 text-[9.5px]",
        tones[tone],
        className,
      )}
      title={name}
    >
      {initials(name)}
      {status && (
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-[2px]">
          <StatusDot
            status={status === "online" ? "online" : status === "away" ? "warning" : "idle"}
            className="size-1.5 [&>span]:size-1.5"
          />
        </span>
      )}
    </span>
  );
}
