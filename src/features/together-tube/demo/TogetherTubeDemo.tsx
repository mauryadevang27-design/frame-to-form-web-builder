import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "../components/toast";
import { useTogetherTube } from "../hooks/use-together-tube";
import { youTubeWatchUrl } from "../lib/youtube";
import { DEMO_VIDEO, SELF_ID } from "../mock/data";
import { createMockRoomService } from "../services/mock-room-service";
import { TogetherTubePopup } from "../TogetherTubePopup";
import { BrowserChrome } from "./BrowserChrome";
import { PrototypeControls } from "./PrototypeControls";
import { YouTubeBackdrop } from "./YouTubeBackdrop";

/** Preview harness: a fake Chrome window hosting the real extension UI. Must sit inside <ToastProvider>. */
export function TogetherTubeDemo() {
  const toast = useToast();
  const service = useMemo(() => createMockRoomService(), []);
  const [popupOpen, setPopupOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  const session = useTogetherTube(service, {
    onEvent: (event, prev) => {
      const room = prev.room;
      if (!room) return;
      const amHost = room.hostId === SELF_ID;
      switch (event.type) {
        case "participant_joined":
          if (
            prev.prefs.notifyPresence &&
            !room.participants.some((p) => p.id === event.participant.id)
          )
            toast.show({
              title: `${event.participant.name} joined`,
              description: "Synced to the current timestamp.",
              tone: "info",
            });
          break;
        case "participant_left": {
          const p = room.participants.find((x) => x.id === event.participantId);
          if (p && prev.prefs.notifyPresence)
            toast.show({ title: `${p.name} left the room`, tone: "info" });
          break;
        }
        case "host_presence":
          if (!amHost)
            toast.show(
              event.online
                ? { title: "Host is back", description: "Playback is in sync again." }
                : {
                    title: "Host disconnected",
                    description: "Playback paused for everyone.",
                    tone: "warning",
                  },
            );
          break;
        case "connection":
          if (event.state === "lost") toast.show({ title: "Connection lost", tone: "error" });
          if (event.state === "connected" && prev.connection === "reconnecting")
            toast.show({ title: "Back in sync" });
          break;
        case "video_changed":
          toast.show(
            event.video
              ? { title: "Video detected", description: event.video.title }
              : { title: "YouTube video not detected", tone: "warning" },
          );
          break;
      }
    },
  });

  const { state } = session;
  const video = state.room?.video ?? DEMO_VIDEO;
  const live = !!state.room && state.connection === "connected";

  const togglePanel = () => {
    setPanelOpen((v) => !v);
    setPopupOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-stage md:h-screen md:overflow-hidden">
      <BrowserChrome
        url={youTubeWatchUrl(video.id).replace("https://", "")}
        popupOpen={popupOpen && !panelOpen}
        panelOpen={panelOpen}
        live={live}
        onToggleExtension={() => {
          setPanelOpen(false);
          setPopupOpen((v) => !v || panelOpen);
        }}
        onTogglePanel={togglePanel}
      />
      <div className="relative flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 flex-col items-center gap-4 p-2 pb-6 md:block md:p-0">
          <YouTubeBackdrop video={video} />

          {popupOpen && !panelOpen && (
            <div className="z-10 animate-pop-in md:absolute md:right-3 md:top-2 origin-top-right">
              <TogetherTubePopup session={session} className="max-w-[calc(100vw-1rem)]" />
            </div>
          )}

          <PrototypeControls
            session={session}
            className={cn(
              "z-20 w-full max-w-[400px] md:absolute md:bottom-4 md:left-4 md:w-[290px]",
            )}
          />
        </div>

        {panelOpen && (
          <aside className="hidden w-[380px] shrink-0 border-l border-border md:flex animate-screen-forward">
            <TogetherTubePopup session={session} variant="panel" />
          </aside>
        )}
      </div>
    </div>
  );
}
