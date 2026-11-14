import { useState, type ReactNode } from "react";
import { FlaskConical, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TogetherTubeSession } from "../hooks/use-together-tube";
import { DEMO_VIDEO, LATE_JOINERS, SELF_ID } from "../mock/data";

function Btn({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-border bg-surface px-2 py-1.5 text-left text-[11.5px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * Lives outside the extension frame. Emits the same RoomEvents a real server
 * would, so every state can be previewed without a backend.
 */
export function PrototypeControls({
  session,
  className,
}: {
  session: TogetherTubeSession;
  className?: string;
}) {
  const { state, isHost, actions } = session;
  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const room = state.room;
  const inRoom = state.screen === "room" && !!room;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const nextJoiner = LATE_JOINERS.find((p) => !room?.participants.some((x) => x.id === p.id));
  const leaver = room?.participants.filter((p) => p.id !== SELF_ID && p.id !== room.hostId).at(-1);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-popover px-3 py-1.5 text-[11.5px] text-muted-foreground shadow-popup hover:text-foreground",
          className,
        )}
      >
        <FlaskConical className="size-3.5 text-primary" /> Prototype controls
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border-strong bg-popover/90 p-3 shadow-popup backdrop-blur-md",
        className,
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
            <FlaskConical className="size-3.5 text-primary" /> Prototype controls
          </p>
          <p className="text-[11px] text-subtle-foreground">
            Simulates server events. Not part of the extension.
          </p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse"
          className="rounded p-0.5 text-subtle-foreground hover:text-foreground"
        >
          <Minus className="size-3.5" />
        </button>
      </div>

      <p className="mb-1.5 mt-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
        Jump to
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <Btn
          disabled={busy}
          onClick={() =>
            run(async () => actions.enterRoom(await actions.createRoom({ name: "Movie night" })))
          }
        >
          Host view
        </Btn>
        <Btn
          disabled={busy}
          onClick={() => run(async () => actions.enterRoom(await actions.joinRoom("K7M4QX")))}
        >
          Guest view
        </Btn>
        <Btn disabled={busy} onClick={() => actions.openInvite("K7M4QX")}>
          Invitation link
        </Btn>
        <Btn disabled={busy} onClick={() => actions.openInvite("END3D2")}>
          Expired invitation
        </Btn>
      </div>

      <p className="mb-1.5 mt-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
        Room events{" "}
        {!inRoom && <span className="normal-case tracking-normal">· open a room first</span>}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <Btn
          disabled={!inRoom || !nextJoiner}
          onClick={() =>
            nextJoiner && actions.emit({ type: "participant_joined", participant: nextJoiner })
          }
        >
          Someone joins
        </Btn>
        <Btn
          disabled={!inRoom || !leaver}
          onClick={() =>
            leaver && actions.emit({ type: "participant_left", participantId: leaver.id })
          }
        >
          Someone leaves
        </Btn>
        <Btn
          disabled={!inRoom || state.connection !== "connected"}
          onClick={() => actions.emit({ type: "connection", state: "lost" })}
        >
          Connection lost
        </Btn>
        <Btn
          disabled={!inRoom || state.connection !== "connected"}
          onClick={() => actions.emit({ type: "connection", state: "reconnecting" })}
        >
          Reconnecting
        </Btn>
        <Btn
          disabled={!inRoom}
          onClick={() =>
            actions.emit({ type: "video_changed", video: room?.video ? null : DEMO_VIDEO })
          }
        >
          {room?.video || !inRoom ? "Video not detected" : "Video detected"}
        </Btn>
        <Btn
          disabled={!inRoom || isHost}
          onClick={() => actions.emit({ type: "host_presence", online: !state.hostOnline })}
        >
          {state.hostOnline ? "Host disconnects" : "Host returns"}
        </Btn>
        <Btn disabled={!inRoom || isHost} onClick={() => actions.emit({ type: "room_ended" })}>
          Host ends room
        </Btn>
      </div>
    </div>
  );
}
