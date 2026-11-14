import { useState, type FormEvent } from "react";
import { Check, Link2, Lock, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtensionHeader } from "../components/ExtensionHeader";
import { Field } from "../components/Field";
import { ScreenBody, ScreenFooter } from "../components/PopupFrame";
import { Spinner } from "../components/Spinner";
import { StateView } from "../components/StateView";
import { useToast } from "../components/toast";
import type { TogetherTubeSession } from "../hooks/use-together-tube";
import { parseYouTubeVideoId, youTubeThumbnail } from "../lib/youtube";

export const ROOM_NAME_MAX = 40;

type Phase = "idle" | "creating" | "ready";

export function CreateRoomScreen({ session }: { session: TogetherTubeSession }) {
  const { actions } = session;
  const toast = useToast();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");

  const videoId = parseYouTubeVideoId(url);
  const urlError = url.trim() && !videoId ? "That doesn't look like a YouTube video link." : null;
  const nameError =
    name.length > ROOM_NAME_MAX ? `Keep it under ${ROOM_NAME_MAX} characters.` : null;
  const busy = phase !== "idle";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (urlError || nameError) return;
    setPhase("creating");
    try {
      const room = await actions.createRoom({ name, videoUrl: url });
      setPhase("ready");
      setTimeout(() => actions.enterRoom(room), 700);
    } catch {
      setPhase("idle");
      toast.show({
        title: "Couldn't create the room",
        description: "Check your connection and try again.",
        tone: "error",
      });
    }
  };

  if (phase === "ready") {
    return (
      <>
        <ExtensionHeader title="New room" />
        <ScreenBody className="flex items-center justify-center">
          <StateView
            icon={<Check />}
            tone="success"
            title="Room ready"
            description="Opening your watch party…"
          />
        </ScreenBody>
      </>
    );
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <ExtensionHeader title="New room" onBack={busy ? undefined : actions.back} />
      <ScreenBody>
        <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
          Create your room
        </h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Start a private watch party and invite your friends.
        </p>

        <fieldset disabled={busy} className="mt-5 space-y-4 transition-opacity disabled:opacity-60">
          <Field
            label="Room name"
            optional
            icon={<Type />}
            placeholder="Friday movie night"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={touched || name.length > ROOM_NAME_MAX ? nameError : null}
            hint={`${name.length}/${ROOM_NAME_MAX}`}
            autoFocus
          />
          <Field
            label="YouTube video"
            optional
            icon={<Link2 />}
            placeholder="Paste a youtube.com or youtu.be link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            error={touched ? urlError : null}
            hint="Leave empty to use the video open in this tab."
          />

          {videoId && (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-2 animate-rise-in">
              <img
                src={youTubeThumbnail(videoId)}
                alt=""
                className="h-10 w-[72px] rounded-md object-cover"
              />
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-[12px] font-medium text-foreground">
                  <Check className="size-3.5 text-success" /> Video detected
                </p>
                <p className="truncate font-mono text-[11px] text-subtle-foreground">
                  youtu.be/{videoId}
                </p>
              </div>
            </div>
          )}
        </fieldset>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border bg-surface p-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Lock className="size-3.5" />
          </span>
          <div>
            <p className="text-[12.5px] font-medium text-foreground">Private room</p>
            <p className="text-[11.5px] text-muted-foreground">
              Only people with your invitation can join.
            </p>
          </div>
        </div>
      </ScreenBody>
      <ScreenFooter>
        <Button type="submit" variant="primary" size="xl" className="w-full" disabled={busy}>
          {busy ? (
            <>
              <Spinner /> Creating room…
            </>
          ) : (
            "Create Room"
          )}
        </Button>
      </ScreenFooter>
    </form>
  );
}
