import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRoomCode } from "../lib/room-code";

interface RoomInvitationCardProps {
  code: string;
  inviteLink: string;
  onCopy: () => Promise<boolean>;
  onShare: () => void;
}

export function RoomInvitationCard({ code, inviteLink, onCopy, onShare }: RoomInvitationCardProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (await onCopy()) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-3 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
            Invite friends
          </p>
          <p className="mt-1 font-mono text-[18px] font-medium tracking-[0.14em] text-foreground">
            {formatRoomCode(code)}
          </p>
        </div>
        <span className="rounded-md bg-surface-raised px-2 py-1 text-[10.5px] text-muted-foreground">
          Room code
        </span>
      </div>
      <p className="mt-1 truncate font-mono text-[11px] text-subtle-foreground">
        {inviteLink.replace("https://", "")}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="surface" size="sm" className="h-8 rounded-lg" onClick={copy}>
          {copied ? <Check className="text-success" /> : <Copy />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button variant="surface" size="sm" className="h-8 rounded-lg" onClick={onShare}>
          <Share2 /> Share
        </Button>
      </div>
    </section>
  );
}
