import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "destructive" | "muted";

const toneClass: Record<Tone, string> = {
  primary: "bg-primary/12 text-primary ring-primary/20",
  success: "bg-success/12 text-success ring-success/20",
  warning: "bg-warning/12 text-warning ring-warning/20",
  destructive: "bg-destructive/12 text-destructive ring-destructive/20",
  muted: "bg-surface-raised text-muted-foreground ring-border-strong",
};

/** Shared layout for empty, loading, success and error states. */
export function StateView({
  icon,
  tone = "primary",
  title,
  description,
  children,
  className,
}: {
  icon: ReactNode;
  tone?: Tone | undefined;
  title: string;
  description?: ReactNode | undefined;
  children?: ReactNode | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("flex flex-col items-center px-2 text-center animate-rise-in", className)}>
      <div
        className={cn(
          "mb-3.5 flex size-12 items-center justify-center rounded-2xl ring-1 [&_svg]:size-5",
          toneClass[tone],
        )}
      >
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-[280px] text-[12.5px] leading-5 text-muted-foreground">
          {description}
        </p>
      )}
      {children && <div className="mt-4 flex w-full flex-col gap-2">{children}</div>}
    </div>
  );
}
