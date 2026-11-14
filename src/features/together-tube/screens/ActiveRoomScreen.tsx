import { useCallback, useState } from "react";
import { Check, Copy, Hash, LogOut, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { ConnectionBanner, ConnectionStatus } from "../components/ConnectionStatus";
import { ExtensionHeader } from "../components/ExtensionHeader";
import { GuestPlaybackStatus, HostControls } from "../components/HostControls";
import { ParticipantList } from "../components/ParticipantList";
import { ScreenBody } from "../components/PopupFrame";
import { RoomInvitationCard } from "../components/RoomInvitationCard";
import { RoomSettings } from "../components/RoomSettings";
import { useToast } from "../components/toast";
import { VideoPreview } from "../components/VideoPreview";
import type { TogetherTubeSession } from "../hooks/use-together-tube";
import { copyText } from "../lib/clipboard";
import { formatRoomCode } from "../lib/room-code";

type Modal = null | "leave" | "end" | "code";

export function ActiveRoomScreen({ session }: { session: TogetherTubeSession }) {
  const { state, isHost, actions } = session;
  const room = state.room!;
  const toast = useToast();
  const [modal, setModal] = useState<Modal>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const close = useCallback(() => setModal(null), []);

  const host = room.participants.find((p) => p.id === room.hostId);
  const watching = room.participants.filter((p) => p.status === "online").length;

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
    <>
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

      <ScreenBody className="space-y-3 pb-16">
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

        <ParticipantList participants={room.participants} />

        <RoomInvitationCard
          code={room.code}
          inviteLink={room.inviteLink}
          onCopy={copyLink}
          onShare={() => void share()}
        />
      </ScreenBody>

      <ConfirmationModal
        open={modal === "leave"}
        icon={<LogOut />}
        title="Leave this room?"
        description={
          isHost
            ? "You're the host. The room stays open, but playback won't be controlled until you return."
            : "You'll stop syncing with everyone. You can rejoin with the same code."
        }
        confirmLabel="Leave room"
        onConfirm={actions.leaveRoom}
        onClose={close}
      />
      <ConfirmationModal
        open={modal === "end"}
        icon={<Power />}
        title="End room for everyone?"
        description={`All ${room.participants.length} people will be disconnected and the invitation link will stop working.`}
        confirmLabel="End room"
        onConfirm={actions.endRoom}
        onClose={close}
      />
      <ConfirmationModal
        open={modal === "code"}
        icon={<Hash />}
        tone="primary"
        title="Room code"
        description="Friends can enter this in TogetherTube → Join a Room."
        confirmLabel="Done"
        cancelLabel="Close"
        onClose={close}
      >
        <div className="flex items-center justify-between rounded-xl border border-border-strong bg-surface px-3 py-2.5">
          <span className="font-mono text-[22px] font-medium tracking-[0.2em] text-foreground">
            {formatRoomCode(room.code)}
          </span>
          <Button
            variant="quiet"
            size="iconSm"
            aria-label="Copy room code"
            onClick={async () => {
              if (await copyText(room.code)) {
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 1500);
              }
            }}
          >
            {codeCopied ? <Check className="text-success" /> : <Copy />}
          </Button>
        </div>
      </ConfirmationModal>
    </>
  );
}
