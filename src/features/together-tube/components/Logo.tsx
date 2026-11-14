import { cn } from "@/lib/utils";

/** Two overlapping play shapes — two screens, one moment. */
export function TogetherTubeMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-7 items-center justify-center rounded-[9px] bg-gradient-primary shadow-glow",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" aria-hidden>
        <path d="M6 5.5v13l7.5-6.5z" className="fill-primary-foreground/55" />
        <path d="M10.5 5.5v13l8-6.5z" className="fill-primary-foreground" />
      </svg>
    </span>
  );
}
