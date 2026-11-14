import { Crown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SELF_ID } from "../mock/data";
import type { Participant } from "../types";
import { ParticipantAvatar } from "./ParticipantAvatar";

export function ParticipantList({
  participants,
  selfId = SELF_ID,
}: {
  participants: Participant[];
  selfId?: string;
}) {
  const sorted = [...participants].sort((a, b) => Number(b.isHost) - Number(a.isHost));
  const onlineCount = participants.filter((p) => p.status === "online").length;
  const alone = participants.length <= 1;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-[11px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
          In the room
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {sorted.slice(0, 4).map((p) => (
              <ParticipantAvatar
                key={p.id}
                name={p.name}
                tone={p.tone}
                size="sm"
                className="animate-pop-in"
              />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">{onlineCount} watching</span>
        </div>
      </div>

      <ul className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {sorted.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2.5 border-b border-border px-3 py-2 last:border-b-0 animate-rise-in"
          >
            <ParticipantAvatar name={p.name} tone={p.tone} status={p.status} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">
                {p.name}
                {p.id === selfId && (
                  <span className="ml-1 font-normal text-subtle-foreground">(You)</span>
                )}
              </p>
              <p
                className={cn(
                  "text-[11px]",
                  p.status === "online" ? "text-muted-foreground" : "text-destructive",
                )}
              >
                {p.status === "online" ? "Watching" : p.status === "away" ? "Away" : "Disconnected"}
              </p>
            </div>
            {p.isHost && (
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-medium text-primary">
                <Crown className="size-3" /> Host
              </span>
            )}
          </li>
        ))}
        {alone && (
          <li className="flex items-center gap-2.5 border-t border-dashed border-border-strong px-3 py-2.5">
            <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-border-strong text-subtle-foreground">
              <UserPlus className="size-3.5" />
            </span>
            <div className="flex-1">
              <p className="text-[12.5px] font-medium text-muted-foreground">
                Waiting for friends to join…
              </p>
              <p className="text-[11px] text-subtle-foreground">Share your invitation below.</p>
            </div>
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1 rounded-full bg-subtle-foreground animate-pulse"
                  style={{ animationDelay: `${i * 180}ms` }}
                />
              ))}
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}
