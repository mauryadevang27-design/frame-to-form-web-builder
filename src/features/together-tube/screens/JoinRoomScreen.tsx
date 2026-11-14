import { useState, type FormEvent } from "react";
import { Check, KeyRound, SearchX, TimerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtensionHeader } from "../components/ExtensionHeader";
import { Field } from "../components/Field";
import { ScreenBody, ScreenFooter } from "../components/PopupFrame";
import { IndeterminateBar, Spinner } from "../components/Spinner";
import { StateView } from "../components/StateView";
import type { TogetherTubeSession } from "../hooks/use-together-tube";
import { formatRoomCode, parseRoomInput } from "../lib/room-code";
import { RoomError, type Room } from "../types";

type Phase =
  | { kind: "idle" }
  | { kind: "connecting"; code: string }
  | { kind: "joined"; room: Room }
  | { kind: "failed"; reason: "not_found" | "ended" | "network"; code: string };

export const DEMO_CODES = ["K7M4QX", "PRN8TV"];

export function JoinRoomScreen({ session }: { session: TogetherTubeSession }) {
  const { actions } = session;
  const [value, setValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const submit = async (e?: FormEvent, override?: string) => {
    e?.preventDefault();
    const parsed = parseRoomInput(override ?? value);
    if (!parsed.ok) {
      setFieldError(
        parsed.reason === "empty"
          ? "Enter a room code or invitation link."
          : "Room codes are 6 characters, like K7M-4QX.",
      );
      return;
    }
    setFieldError(null);
    if (parsed.fromLink) return actions.openInvite(parsed.code);

    setPhase({ kind: "connecting", code: parsed.code });
    try {
      const room = await actions.joinRoom(parsed.code);
      setPhase({ kind: "joined", room });
      setTimeout(() => actions.enterRoom(room), 1000);
    } catch (err) {
      setPhase({
        kind: "failed",
        code: parsed.code,
        reason: err instanceof RoomError ? err.kind : "network",
      });
    }
  };

  const onChange = (raw: string) => {
    setFieldError(null);
    if (phase.kind === "failed") setPhase({ kind: "idle" });
    // Format typed codes as XXX-XXX; leave pasted links untouched.
    if (/[/:.]/.test(raw)) return setValue(raw);
    const clean = raw
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    setValue(clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean);
  };

  if (phase.kind === "joined") {
    const host = phase.room.participants.find((p) => p.id === phase.room.hostId);
    return (
      <>
        <ExtensionHeader title="Join a room" />
        <ScreenBody className="flex items-center justify-center">
          <StateView
            icon={<Check />}
            tone="success"
            title={`You're in ${phase.room.name}`}
            description={`Syncing to ${host?.name ?? "the host"}'s playback…`}
          >
            <IndeterminateBar className="mx-auto mt-1 w-32" />
          </StateView>
        </ScreenBody>
      </>
    );
  }

  const connecting = phase.kind === "connecting";

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <ExtensionHeader title="Join a room" onBack={connecting ? undefined : actions.back} />
      <ScreenBody>
        <h2 className="text-[17px] font-semibold tracking-tight text-foreground">Join a Room</h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Enter your invitation code to join your friends.
        </p>

        <Field
          className="mt-5"
          label="Room code"
          icon={<KeyRound />}
          placeholder="K7M-4QX or invitation link"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={fieldError}
          hint="You can also paste the full invitation link."
          inputClassName="font-mono tracking-[0.12em] placeholder:font-sans placeholder:tracking-normal"
          disabled={connecting}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />

        {connecting && (
          <div className="mt-4 rounded-xl border border-border bg-surface p-3 animate-rise-in">
            <div className="flex items-center gap-2 text-[12.5px] text-foreground">
              <Spinner className="text-primary" /> Connecting to room{" "}
              <span className="font-mono">{formatRoomCode(phase.code)}</span>…
            </div>
            <IndeterminateBar className="mt-3" />
          </div>
        )}

        {phase.kind === "failed" && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 p-3 animate-rise-in">
            {phase.reason === "ended" ? (
              <TimerOff className="mt-0.5 size-4 shrink-0 text-destructive" />
            ) : (
              <SearchX className="mt-0.5 size-4 shrink-0 text-destructive" />
            )}
            <div>
              <p className="text-[12.5px] font-medium text-foreground">
                {phase.reason === "not_found" && "Room not found"}
                {phase.reason === "ended" && "This room has ended"}
                {phase.reason === "network" && "Couldn't reach TogetherTube"}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                {phase.reason === "not_found" &&
                  "Double-check the code, or ask your host for a new invitation."}
                {phase.reason === "ended" &&
                  "The host closed this watch party. Ask them to start a new one."}
                {phase.reason === "network" && "Check your connection and try again."}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
            Demo rooms
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_CODES.map((c) => (
              <button
                key={c}
                type="button"
                disabled={connecting}
                onClick={() => {
                  onChange(c);
                  void submit(undefined, c);
                }}
                className="rounded-lg border border-border-strong bg-surface px-2.5 py-1 font-mono text-[11.5px] tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
              >
                {formatRoomCode(c)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-subtle-foreground">
            Any other valid code shows the "room not found" state.
          </p>
        </div>
      </ScreenBody>
      <ScreenFooter>
        <Button type="submit" variant="primary" size="xl" className="w-full" disabled={connecting}>
          {connecting ? (
            <>
              <Spinner /> Connecting…
            </>
          ) : (
            "Join Room"
          )}
        </Button>
      </ScreenFooter>
    </form>
  );
}
