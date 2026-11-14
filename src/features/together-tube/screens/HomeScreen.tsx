import { ArrowRight, Settings, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExtensionHeader } from "../components/ExtensionHeader";
import { HeroIllustration } from "../components/HeroIllustration";
import { ScreenBody } from "../components/PopupFrame";
import { StatusDot } from "../components/StatusDot";
import type { TogetherTubeSession } from "../hooks/use-together-tube";

const steps = [
  { title: "Create or join a room", body: "One click, no account needed." },
  { title: "Share your invitation link", body: "Friends join with the link or code." },
  { title: "Watch together in sync", body: "Play, pause and seek stay aligned." },
];

export function HomeScreen({ session }: { session: TogetherTubeSession }) {
  const { actions } = session;
  return (
    <>
      <ExtensionHeader
        subtitle={
          <>
            <StatusDot status="online" pulse /> Ready
          </>
        }
        right={
          <Button
            variant="quiet"
            size="iconSm"
            aria-label="Settings"
            onClick={() => actions.go("settings")}
          >
            <Settings />
          </Button>
        }
      />
      <ScreenBody className="flex flex-col pt-3">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground">
            <ShieldCheck className="size-3 text-primary" /> Private YouTube Watch Parties
          </span>
        </div>

        <HeroIllustration />

        <div className="mt-1 text-center">
          <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-foreground">
            Watch Together. Anywhere.
          </h1>
          <p className="mx-auto mt-1.5 max-w-[290px] text-[13px] leading-5 text-muted-foreground">
            Your favorite YouTube videos, synchronized with everyone you love.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <Button
            variant="primary"
            size="xl"
            className="group w-full"
            onClick={() => actions.go("create")}
          >
            Create a Room
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button variant="surface" size="xl" className="w-full" onClick={() => actions.go("join")}>
            Join a Room
          </Button>
        </div>

        <div className="mt-5">
          <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-subtle-foreground">
            How it works
          </h2>
          <ol className="space-y-1">
            {steps.map((s, i) => (
              <li key={s.title} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface font-mono text-[10.5px] text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium leading-4 text-foreground">{s.title}</p>
                  <p className="text-[11.5px] text-subtle-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </ScreenBody>
    </>
  );
}
