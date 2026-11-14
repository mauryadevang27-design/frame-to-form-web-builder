import * as Menu from "@radix-ui/react-dropdown-menu";
import { Hash, Link2, LogOut, MoreHorizontal, Power } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RoomSettingsProps {
  isHost: boolean;
  onCopyLink: () => void;
  onViewCode: () => void;
  onLeave: () => void;
  onEnd: () => void;
}

function Item({
  icon,
  children,
  onSelect,
  danger,
}: {
  icon: ReactNode;
  children: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}) {
  return (
    <Menu.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] outline-none transition-colors [&_svg]:size-4",
        danger
          ? "text-destructive data-[highlighted]:bg-destructive/10"
          : "text-foreground data-[highlighted]:bg-surface-raised [&_svg]:text-muted-foreground",
      )}
    >
      {icon}
      {children}
    </Menu.Item>
  );
}

/** Rendered without a portal so it stays inside the popup (or side panel). */
export function RoomSettings({
  isHost,
  onCopyLink,
  onViewCode,
  onLeave,
  onEnd,
}: RoomSettingsProps) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>
        <Button
          variant="quiet"
          size="iconSm"
          aria-label="Room options"
          className="data-[state=open]:bg-surface-raised data-[state=open]:text-foreground"
        >
          <MoreHorizontal />
        </Button>
      </Menu.Trigger>
      <Menu.Content
        align="end"
        sideOffset={6}
        className="z-40 w-[200px] rounded-xl border border-border-strong bg-popover p-1 shadow-popup data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 origin-top-right"
      >
        <Item icon={<Link2 />} onSelect={onCopyLink}>
          Copy room link
        </Item>
        <Item icon={<Hash />} onSelect={onViewCode}>
          View room code
        </Item>
        <Menu.Separator className="my-1 h-px bg-border" />
        <Item icon={<LogOut />} onSelect={onLeave} danger={!isHost}>
          Leave room
        </Item>
        {isHost && (
          <Item icon={<Power />} onSelect={onEnd} danger>
            End room for everyone
          </Item>
        )}
      </Menu.Content>
    </Menu.Root>
  );
}
