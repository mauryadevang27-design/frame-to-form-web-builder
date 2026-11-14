import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "@/styles.css";
import { TogetherTubePopup } from "@/features/together-tube/TogetherTubePopup";
import { ToastProvider, useToast } from "@/features/together-tube/components/toast";
import { useTogetherTube } from "@/features/together-tube/hooks/use-together-tube";
import { createRealtimeRoomService } from "@/features/together-tube/services/realtime-room-service";

function ExtensionApp() {
  const toast = useToast();
  const service = useMemo(() => createRealtimeRoomService(), []);
  const [, setActiveTabInfo] = useState<{ id?: string; title?: string } | null>(null);

  // Probe active YouTube tab on startup
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab?.id && currentTab.url?.includes("youtube.com/watch")) {
          chrome.tabs.sendMessage(currentTab.id, { type: "GET_YOUTUBE_INFO" }, (res) => {
            if (res && res.ok && res.data) {
              setActiveTabInfo(res.data);
              toast.show({
                title: "YouTube video detected!",
                description: res.data.title,
                tone: "info",
              });
            }
          });
        }
      });
    }
  }, [toast]);

  const session = useTogetherTube(service, {
    onEvent: (event, prev) => {
      const room = prev.room;
      if (!room) return;
      const isHost = room.hostId === service.getUserId();

      // Forward playback events directly to active YouTube tab
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          if (tab?.id && tab.url?.includes("youtube.com/watch")) {
            if (event.type === "playback") {
              const msgType = event.playback.isPlaying ? "SYNC_PLAY" : "SYNC_PAUSE";
              chrome.tabs.sendMessage(tab.id, {
                type: msgType,
                positionSec: event.playback.positionSec,
              });
            } else if (event.type === "video_changed" && event.video) {
              chrome.tabs.sendMessage(tab.id, {
                type: "NAVIGATE_VIDEO",
                videoId: event.video.id,
              });
            }
          }
        });
      }

      switch (event.type) {
        case "participant_joined":
          if (
            prev.prefs.notifyPresence &&
            !room.participants.some((p) => p.id === event.participant.id)
          ) {
            toast.show({
              title: `${event.participant.name} joined`,
              description: "Synced to current timestamp.",
              tone: "info",
            });
          }
          break;
        case "participant_left": {
          const p = room.participants.find((x) => x.id === event.participantId);
          if (p && prev.prefs.notifyPresence) {
            toast.show({ title: `${p.name} left the room`, tone: "info" });
          }
          break;
        }
        case "host_presence":
          if (!isHost) {
            toast.show(
              event.online
                ? { title: "Host is back", description: "Playback is in sync again." }
                : {
                    title: "Host disconnected",
                    description: "Playback paused for everyone.",
                    tone: "warning",
                  },
            );
          }
          break;
        case "connection":
          if (event.state === "lost") {
            toast.show({
              title: "Server offline",
              description: "Run 'npm run server' in PowerShell for live multi-user sync.",
              tone: "warning",
            });
          }
          if (event.state === "connected") {
            toast.show({ title: "Connected to Realtime Server" });
          }
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

  // Listen for local player events from YouTube tab (e.g. host clicks play/pause on YouTube)
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return;

    const listener = (message: any) => {
      if (message.type === "LOCAL_PLAYER_EVENT" && session.isHost && session.state.room) {
        if (message.action === "play") {
          session.actions.setPlayback({ isPlaying: true });
        } else if (message.action === "pause") {
          session.actions.setPlayback({ isPlaying: false });
        }
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [session.isHost, session.state.room, session.actions]);

  return (
    <div className="flex h-full w-full flex-col">
      <TogetherTubePopup session={session} variant="popup" />
    </div>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ToastProvider>
        <ExtensionApp />
      </ToastProvider>
    </React.StrictMode>,
  );
}
