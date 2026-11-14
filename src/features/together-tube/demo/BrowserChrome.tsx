import { ArrowLeft, ArrowRight, Lock, PanelRight, Puzzle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TogetherTubeMark } from "../components/Logo";

/** A minimal Chrome toolbar so the popup reads as an extension, not a web page. */
export function BrowserChrome({
  url,
  popupOpen,
  panelOpen,
  onToggleExtension,
  onTogglePanel,
  live,
}: {
  url: string;
  popupOpen: boolean;
  panelOpen: boolean;
  onToggleExtension: () => void;
  onTogglePanel: () => void;
  live: boolean;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-chrome px-3">
      <div className="hidden items-center gap-0.5 text-subtle-foreground sm:flex [&_svg]:size-4">
        <span className="p-1.5">
          <ArrowLeft />
        </span>
        <span className="p-1.5">
          <ArrowRight />
        </span>
        <span className="p-1.5">
          <RotateCw />
        </span>
      </div>
      <div className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full bg-stage px-3.5 text-[12.5px] text-muted-foreground">
        <Lock className="size-3 shrink-0" />
        <span className="truncate">{url}</span>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={onToggleExtension}
          aria-label="TogetherTube extension"
          aria-pressed={popupOpen}
          className={cn(
            "relative rounded-full p-1.5 transition-colors hover:bg-surface-raised",
            popupOpen && "bg-surface-raised",
          )}
        >
          <TogetherTubeMark className="size-5 rounded-[6px] shadow-none" />
          {live && (
            <span className="absolute right-0.5 top-0.5 size-2 rounded-full border-2 border-chrome bg-success" />
          )}
        </button>
        <span className="rounded-full p-1.5 text-subtle-foreground">
          <Puzzle className="size-4" />
        </span>
        <button
          onClick={onTogglePanel}
          aria-label="Open in side panel"
          aria-pressed={panelOpen}
          className={cn(
            "hidden rounded-full p-1.5 text-subtle-foreground transition-colors hover:bg-surface-raised hover:text-foreground md:block",
            panelOpen && "bg-surface-raised text-foreground",
          )}
        >
          <PanelRight className="size-4" />
        </button>
        <span className="ml-1 flex size-7 items-center justify-center rounded-full bg-chart-1/20 text-[11px] font-semibold text-chart-1">
          D
        </span>
      </div>
    </div>
  );
}
