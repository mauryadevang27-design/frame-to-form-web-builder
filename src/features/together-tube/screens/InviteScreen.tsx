import { useEffect, useState } from "react";
import { Check, Mail, SearchX, TimerOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtensionHeader } from "../components/ExtensionHeader";
import { ScreenBody, ScreenFooter } from "../components/PopupFrame";
import { IndeterminateBar, Spinner } from "../components/Spinner";
import { StateView } from "../components/StateView";
import type { TogetherTubeSession } from "../hooks/use-together-tube";
import { buildInviteLink, formatRoomCode } from "../lib/room-code";
import { RoomError, type RoomPreview } from "../types";

type Phase =
  | { kind: "loading" }
  | { kind: "ready"; preview: RoomPreview }
  | { kind: "joining"; preview: RoomPreview }
  | { kind: "joined"; preview: RoomPreview }
  | { kind: "error"; reason: "not_found" | "ended" | "network" };

/** Opened from an invitation link (togethertube.app/join/CODE). */
export function InviteScreen({ session }: { session: TogetherTubeSession }) {
  const { state, actions } = session;
  const code = state.inviteCode ?? "";
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    setPhase({ kind: "loading" });
    actions
      .previewRoom(code)
      .then((preview) => alive && setPhase({ kind: "ready", preview }))
      .catch(
        (err) =>
          alive &&
          setPhase({ kind: "error", reason: err instanceof RoomError ? err.kind : "network" }),
      );
    return () => {
      alive = false;
    };
  }, [code, actions]);

  const join = async (preview: RoomPreview) => {
    setPhase({ kind: "joining", preview });
    try {
      const room = await actions.joinRoom(preview.code);
      setPhase({ kind: "joined", preview });
      setTimeout(() => actions.enterRoom(room), 900);
    } catch (err) {
      setPhase({ kind: "error", reason: err instanceof RoomError ? err.kind : "network" });
    }
  };

  return (
    <>
      <ExtensionHeader
        title="Invitation"
        subtitle={
          <span className="font-mono">{buildInviteLink(code).replace("https://", "")}</span>
        }
        onBack={phase.kind === "joining" || phase.kind === "joined" ? undefined : actions.home}
      />
      <ScreenBody className="flex flex-col justify-center">
        {phase.kind === "loading" && (
          <StateView
            icon={<Mail />}
            title="Opening invitation…"
            description="Looking up this watch party."
          >
            <IndeterminateBar className="mx-auto w-32" />
          </StateView>
        )}

        {phase.kind === "error" && (
          <StateView
            icon={phase.reason === "ended" ? <TimerOff /> : <SearchX />}
            tone="destructive"
            title={
              phase.reason === "ended"
                ? "This room has ended"
                : phase.reason === "not_found"
                  ? "Room not found"
                  : "Couldn't connect"
            }
            description={
              phase.reason === "ended"
                ? "The host closed this watch party."
                : phase.reason === "not_found"
                  ? "This invitation link is invalid or has expired."
                  : "Check your connection and try again."
            }
          >
            <Button variant="surface" className="h-9 rounded-xl" onClick={actions.home}>
              Back to home
            </Button>
          </StateView>
        )}

        {phase.kind === "joined" && (
          <StateView
            icon={<Check />}
            tone="success"
            title={`Joined ${phase.preview.name}`}
            description="Syncing to the host's playback…"
          />
        )}

        {(phase.kind === "ready" || phase.kind === "joining") && (
          <div className="animate-rise-in">
            <p className="text-center text-[12.5px] text-muted-foreground">
              <span className="font-medium text-foreground">{phase.preview.hostName}</span> invited
              you to watch
            </p>
            <h2 className="mt-1 text-center text-[19px] font-semibold tracking-tight text-foreground">
              {phase.preview.name}
            </h2>

            {phase.preview.video && (
              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                <img
                  src={phase.preview.video.thumbnailUrl}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
                <div className="px-3 py-2.5">
                  <p className="truncate text-[12.5px] font-medium text-foreground">
                    {phase.preview.video.title}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {phase.preview.video.channel}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-[12px]">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-3.5" /> {phase.preview.participantCount} watching now
              </span>
              <span className="font-mono text-[11.5px] tracking-[0.1em] text-subtle-foreground">
                {formatRoomCode(phase.preview.code)}
              </span>
            </div>
            <p className="mt-3 text-center text-[11.5px] text-subtle-foreground">
              Joining as <span className="text-muted-foreground">{state.displayName}</span>
            </p>
          </div>
        )}
      </ScreenBody>
      {(phase.kind === "ready" || phase.kind === "joining") && (
        <ScreenFooter>
          <Button
            variant="primary"
            size="xl"
            className="w-full"
            disabled={phase.kind === "joining"}
            onClick={() => join(phase.preview)}
          >
            {phase.kind === "joining" ? (
              <>
                <Spinner /> Joining…
              </>
            ) : (
              "Join watch party"
            )}
          </Button>
        </ScreenFooter>
      )}
    </>
  );
}
