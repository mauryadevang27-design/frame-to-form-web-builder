import { DoorOpen, Power, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtensionHeader } from "../components/ExtensionHeader";
import { ScreenBody } from "../components/PopupFrame";
import { StateView } from "../components/StateView";
import type { TogetherTubeSession } from "../hooks/use-together-tube";

export function RoomEndedScreen({ session }: { session: TogetherTubeSession }) {
  const { state, actions } = session;
  const name = state.endedRoomName ?? "the room";
  const copy = {
    you_ended: {
      icon: <Power />,
      title: "Room ended",
      body: `Everyone has been disconnected from ${name}.`,
    },
    you_left: {
      icon: <DoorOpen />,
      title: "You left the room",
      body: `You're no longer syncing with ${name}.`,
    },
    host_ended: {
      icon: <UserX />,
      title: "The host ended the room",
      body: `${name} is closed. Thanks for watching together.`,
    },
  }[state.endReason ?? "you_left"];

  return (
    <>
      <ExtensionHeader />
      <ScreenBody className="flex items-center justify-center">
        <StateView icon={copy.icon} tone="muted" title={copy.title} description={copy.body}>
          <Button
            variant="primary"
            size="xl"
            className="w-full"
            onClick={() => {
              actions.home();
              actions.go("create");
            }}
          >
            Create a new room
          </Button>
          <Button variant="quiet" className="w-full" onClick={actions.home}>
            Back to home
          </Button>
        </StateView>
      </ScreenBody>
    </>
  );
}
