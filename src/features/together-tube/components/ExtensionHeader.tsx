import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TogetherTubeMark } from "./Logo";

interface ExtensionHeaderProps {
  title?: ReactNode | undefined;
  subtitle?: ReactNode | undefined;
  onBack?: (() => void) | undefined;
  right?: ReactNode | undefined;
}

/** Top bar of every screen. Shows the mark, or a back button on sub-screens. */
export function ExtensionHeader({
  title = "TogetherTube",
  subtitle,
  onBack,
  right,
}: ExtensionHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-3.5">
      {onBack ? (
        <Button variant="quiet" size="iconSm" onClick={onBack} aria-label="Back">
          <ArrowLeft />
        </Button>
      ) : (
        <TogetherTubeMark />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold tracking-tight text-foreground">
          {title}
        </div>
        {subtitle && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>
      {right && <div className="flex items-center gap-1">{right}</div>}
    </header>
  );
}
