import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Hash, LogOut, MessageSquare, Power, Tv, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { ConnectionBanner, ConnectionStatus } from "../components/ConnectionStatus";
import { ExtensionHeader } from "../components/ExtensionHeader";
import { GuestPlaybackStatus, HostControls } from "../components/HostControls";
import { ParticipantList } from "../components/ParticipantList";
import { ScreenBody } from "../components/PopupFrame";
import { RoomChat } from "../components/RoomChat";
import { RoomInvitationCard } from "../components/RoomInvitationCard";
import { RoomSettings } from "../components/RoomSettings";
import { useToast } from "../components/toast";
import { VideoCallView } from "../components/VideoCallView";
import { VideoPreview } from "../components/VideoPreview";
import type { TogetherTubeSession } from "../hooks/use-together-tube";
import { copyText } from "../lib/clipboard";
import { formatRoomCode } from "../lib/room-code";
import { SELF_ID } from "../mock/data";
import { WebRTCManager } from "../webrtc/webrtc-manager";

type Modal = null | "leave" | "end" | "code";

export function ActiveRoomScreen({ session }: { session: TogetherTubeSession }) {
  const { state, isHost, myId, actions, service } = session;
  const room = state.room!;
  const toast = useToast();
  const [modal, setModal] = useState<Modal>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [webrtc, setWebrtc] = useState<WebRTCManager | null>(null);
  const close = useCallback(() => setModal(null), []);

  const host = room.participants.find((p) => p.id === room.hostId);
  const watching = room.participants.filter((p) => p.status === "online").length;

  // Initialize WebRTC signaling if service supports it
  useEffect(() => {
    if (!service.sendSignal || !service.onSignal) return;
    const mgr = new WebRTCManager(myId, (sig) => service.sendSignal!(sig), {
      onError: (err) => {
        toast.show({
          title: "Camera/Mic Error",
          description: err.message || "Could not access media devices.",
          tone: "warning",
        });
      },
    });
    const unsub = service.onSignal((sig) => mgr.handleSignal(sig));
    setWebrtc(mgr);

    return () => {
      unsub();
      mgr.stopCall();
    };
  }, [service, toast, myId]);

  const copyLink = async () => {
    const ok = await copyText(room.inviteLink);
    toast.show(
      ok
        ? {
            title: "Invitation link copied",
            description: "Send it to anyone you want to watch with.",
          }
        : { title: "Couldn't copy the link", tone: "error" },
    );
    return ok;
  };

  const share = async () => {
    const data = { title: `Join ${room.name} on TogetherTube`, url: room.inviteLink };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* cancelled — fall through to copy */
      }
    }
    await copyLink();
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <ExtensionHeader
        title={room.name}
        subtitle={
          <>
            <ConnectionStatus state={state.connection} />
            <span className="text-subtle-foreground">·</span>
            <span className="font-mono tracking-[0.08em]">{formatRoomCode(room.code)}</span>
          </>
        }
        right={
          <RoomSettings
            isHost={isHost}
            onCopyLink={() => void copyLink()}
            onViewCode={() => setModal("code")}
            onLeave={() => setModal("leave")}
            onEnd={() => setModal("end")}
          />
        }
      />

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex border-b border-border bg-surface/50 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => actions.setActiveTab("party")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium transition-all",
            state.activeTab === "party"
              ? "bg-background text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-surface/60",
          )}
        >
          <Tv className="size-3.5 text-primary" />
          Watch Party
        </button>

        <button
          onClick={() => actions.setActiveTab("chat")}
          className={cn(
            "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium transition-all",
            state.activeTab === "chat"
              ? "bg-background text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-surface/60",
          )}
        >
          <MessageSquare className="size-3.5 text-primary" />
          Chat
          {state.unreadChatCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground animate-pop-in">
              {state.unreadChatCount}
            </span>
          )}
        </button>

        <button
          onClick={() => actions.setActiveTab("call")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium transition-all",
            state.activeTab === "call"
              ? "bg-background text-foreground shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-surface/60",
          )}
        >
          <Video className="size-3.5 text-primary" />
          Video Call
        </button>
      </div>

      {/* Tab 1: Watch Party Player & Controls */}
      {state.activeTab === "party" && (
        <ScreenBody className="space-y-3 pb-8">
          <ConnectionBanner state={state.connection} onRetry={actions.reconnect} />

          <VideoPreview video={room.video} playback={room.playback} />

          {isHost ? (
            <HostControls
              isPlaying={room.playback.isPlaying}
              connection={state.connection}
              watcherCount={watching}
              disabled={!room.video}
              onTogglePlay={() => actions.setPlayback({ isPlaying: !room.playback.isPlaying })}
              onSeek={(d) => actions.setPlayback({ seekBy: d })}
            />
          ) : (
            <GuestPlaybackStatus
              hostName={host?.name ?? "Host"}
              hostOnline={state.hostOnline}
              connection={state.connection}
            />
          )}

          <ParticipantList participants={room.participants} selfId={myId} />

          <RoomInvitationCard
            code={room.code}
            inviteLink={room.inviteLink}
            onCopy={copyLink}
            onShare={() => void share()}
          />
        </ScreenBody>
      )}

      {/* Tab 2: Real-time Room Chat */}
      {state.activeTab === "chat" && (
        <RoomChat
          messages={state.chatMessages}
          currentUserId={myId}
          onSend={(text) => actions.sendChat(text)}
        />
      )}

      {/* Tab 3: WebRTC Video Calling */}
      {state.activeTab === "call" && (
        <VideoCallView
          manager={webrtc}
          participants={room.participants}
          currentUserId={myId}
        />
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        open={modal === "leave"}
        icon={<LogOut />}
        title="Leave this room?"
        description={
          isHost
            ? "You're the host. Guests will be paused until you return or someone ends the room."
            : "You'll stop syncing with the host's playback."
        }
        confirmLabel="Leave room"
        tone="danger"
        onConfirm={actions.leaveRoom}
        onClose={close}
      />

      <ConfirmationModal
        open={modal === "end"}
        icon={<Power />}
        title="End room for everyone?"
        description="Every participant will be disconnected immediately. This cannot be undone."
        confirmLabel="End room"
        tone="danger"
        onConfirm={actions.endRoom}
        onClose={close}
      />

      <ConfirmationModal
        open={modal === "code"}
        icon={<Hash />}
        title="Room code"
        description="Share this code with friends who already have TogetherTube installed."
        confirmLabel={codeCopied ? "Copied!" : "Copy code"}
        cancelLabel="Done"
        tone="primary"
        onConfirm={async () => {
          await copyText(room.code);
          setCodeCopied(true);
          setTimeout(() => setCodeCopied(false), 1600);
        }}
        onClose={close}
      >
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
          <span className="font-mono text-[22px] font-semibold tracking-[0.16em] text-foreground">
            {formatRoomCode(room.code)}
          </span>
          <Button
            variant="quiet"
            size="iconSm"
            onClick={async () => {
              await copyText(room.code);
              setCodeCopied(true);
              setTimeout(() => setCodeCopied(false), 1600);
            }}
          >
            {codeCopied ? <Check className="text-success" /> : <Copy />}
          </Button>
        </div>
      </ConfirmationModal>
    </div>
  );
}
