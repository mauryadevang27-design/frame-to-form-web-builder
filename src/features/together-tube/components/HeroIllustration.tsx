/** Two floating screens linked by a live sync line. Pure SVG + CSS, no assets. */
export function HeroIllustration() {
  return (
    <div className="relative mx-auto h-[128px] w-full max-w-[300px]" aria-hidden>
      <div className="absolute inset-0 bg-aura" />
      <svg viewBox="0 0 300 128" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="tt-sync" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary-glow)" />
          </linearGradient>
        </defs>
        <path
          d="M98 70 C 130 40, 170 40, 202 70"
          fill="none"
          stroke="url(#tt-sync)"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          strokeLinecap="round"
          className="animate-sync-dash"
        />
      </svg>

      <Screen className="left-[14%] top-[30px] animate-float-a" avatar="A" />
      <Screen className="right-[14%] top-[30px] animate-float-b" avatar="S" alt />

      <div className="absolute left-1/2 top-[22px] -translate-x-1/2">
        <span className="flex items-center gap-1 rounded-full border border-border-strong bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-card">
          <span className="size-1.5 rounded-full bg-success" /> in sync
        </span>
      </div>
    </div>
  );
}

function Screen({ className, avatar, alt }: { className: string; avatar: string; alt?: boolean }) {
  return (
    <div className={`absolute w-[86px] ${className}`}>
      <div className="overflow-hidden rounded-[10px] border border-border-strong bg-surface-raised shadow-card">
        <div className="relative flex aspect-video items-center justify-center bg-gradient-surface">
          <div className="absolute inset-0 bg-gradient-primary opacity-[0.16]" />
          <svg viewBox="0 0 24 24" className="relative size-5">
            <path d="M8 5.5v13l10-6.5z" className="fill-foreground/85" />
          </svg>
        </div>
        <div className="h-1 bg-border">
          <div className="h-full w-[46%] bg-gradient-primary" />
        </div>
      </div>
      <span
        className={`absolute -bottom-2.5 ${alt ? "-left-2" : "-right-2"} flex size-6 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold ${alt ? "bg-chart-3 text-background" : "bg-chart-2 text-primary-foreground"}`}
      >
        {avatar}
      </span>
    </div>
  );
}
