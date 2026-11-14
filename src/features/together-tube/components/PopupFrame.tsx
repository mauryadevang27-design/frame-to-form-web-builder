import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FrameVariant = "popup" | "panel";

/**
 * The extension surface. "popup" mirrors Chrome's toolbar popup (400×620);
 * "panel" fills a Chrome side panel. Screens are unaware of which is used.
 */
export function PopupFrame({
  variant = "popup",
  children,
  className,
}: {
  variant?: FrameVariant | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden bg-background text-foreground",
        variant === "popup" ? "h-[620px] w-[400px] rounded-2xl shadow-popup" : "h-full w-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Body of a screen: scrolls only if content overflows. */
export function ScreenBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("scrollbar-thin flex-1 overflow-y-auto px-4 py-4", className)}>
      {children}
    </div>
  );
}

export function ScreenFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("shrink-0 border-t border-border px-4 py-3", className)}>{children}</div>
  );
}
