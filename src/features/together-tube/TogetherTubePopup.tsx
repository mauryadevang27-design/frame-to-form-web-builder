import { cn } from "@/lib/utils";
import { PopupFrame, type FrameVariant } from "./components/PopupFrame";
import { ToastViewport, useToast } from "./components/toast";
import { useEffect } from "react";
import type { TogetherTubeSession } from "./hooks/use-together-tube";
import { ActiveRoomScreen } from "./screens/ActiveRoomScreen";
import { CreateRoomScreen } from "./screens/CreateRoomScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { InviteScreen } from "./screens/InviteScreen";
import { JoinRoomScreen } from "./screens/JoinRoomScreen";
import { RoomEndedScreen } from "./screens/RoomEndedScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

/** The full extension UI. Mount in popup.html or sidepanel.html with a session. */
export function TogetherTubePopup({
  session,
  variant = "popup",
  className,
}: {
  session: TogetherTubeSession;
  variant?: FrameVariant | undefined;
  className?: string | undefined;
}) {
  const { state } = session;
  const screen = state.screen === "room" && !state.room ? "home" : state.screen;
  const { clear } = useToast();

  // Notifications belong to the screen that raised them.
  useEffect(() => clear(), [screen, clear]);

  return (
    <PopupFrame variant={variant} className={className}>
      <div
        key={screen}
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          state.direction === "back" ? "animate-screen-back" : "animate-screen-forward",
        )}
      >
        {screen === "home" && <HomeScreen session={session} />}
        {screen === "create" && <CreateRoomScreen session={session} />}
        {screen === "join" && <JoinRoomScreen session={session} />}
        {screen === "invite" && <InviteScreen session={session} />}
        {screen === "room" && <ActiveRoomScreen session={session} />}
        {screen === "settings" && <SettingsScreen session={session} />}
        {screen === "ended" && <RoomEndedScreen session={session} />}
      </div>
      <ToastViewport />
    </PopupFrame>
  );
}
