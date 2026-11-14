import { cn } from "@/lib/utils";

export type StatusTone = "online" | "warning" | "offline" | "idle";

const tone: Record<StatusTone, string> = {
  online: "bg-success",
  warning: "bg-warning",
  offline: "bg-destructive",
  idle: "bg-subtle-foreground",
};

export function StatusDot({
  status = "online",
  pulse = false,
  className,
}: {
  status?: StatusTone | undefined;
  pulse?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <span className={cn("relative inline-flex size-2", className)} aria-hidden>
      {pulse && (
        <span className={cn("absolute inset-0 rounded-full animate-ping-soft", tone[status])} />
      )}
      <span className={cn("relative inline-flex size-2 rounded-full", tone[status])} />
    </span>
  );
}
