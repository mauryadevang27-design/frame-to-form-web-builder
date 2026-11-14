import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

export function IndeterminateBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative h-0.5 w-full overflow-hidden rounded-full bg-border-strong",
        className,
      )}
    >
      <div className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-gradient-primary animate-indeterminate" />
    </div>
  );
}
