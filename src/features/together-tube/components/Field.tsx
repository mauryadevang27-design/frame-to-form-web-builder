import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  optional?: boolean | undefined;
  icon?: ReactNode | undefined;
  hint?: ReactNode | undefined;
  error?: string | null | undefined;
  inputClassName?: string | undefined;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, optional, icon, hint, error, id, className, inputClassName, ...props },
  ref,
) {
  const inputId = id ?? `f-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={inputId}
        className="flex items-center justify-between text-[12px] font-medium text-muted-foreground"
      >
        {label}
        {optional && (
          <span className="text-[11px] font-normal text-subtle-foreground">Optional</span>
        )}
      </label>
      <div
        className={cn(
          "group flex h-10 items-center gap-2 rounded-xl border bg-surface px-3 shadow-card transition-[border-color,box-shadow]",
          "focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15",
          error ? "border-destructive/60 animate-shake" : "border-input",
        )}
      >
        {icon && (
          <span className="text-subtle-foreground group-focus-within:text-primary [&_svg]:size-4">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle-foreground",
            inputClassName,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-[11.5px] text-destructive animate-fade-soft">{error}</p>
      ) : hint ? (
        <p className="text-[11.5px] text-subtle-foreground">{hint}</p>
      ) : null}
    </div>
  );
});
