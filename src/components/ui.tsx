import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/* -------------------------------- Card -------------------------------- */

export function Card({
  className,
  children,
  ...rest
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface shadow-[var(--shadow)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ------------------------------- Button ------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-control font-bold transition-colors duration-150 disabled:opacity-45 disabled:pointer-events-none active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  accent: "bg-accent text-white hover:opacity-90",
  secondary:
    "border border-border-strong bg-surface-2 text-text hover:border-primary/50",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
  danger:
    "border border-[var(--bad)]/30 bg-[var(--bad-soft)] text-bad hover:bg-[var(--bad)]/20",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-sm sm:text-base",
};

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ComponentProps<"button"> & ButtonOwnProps) {
  return (
    <button
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...rest}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ComponentProps<typeof Link> & ButtonOwnProps) {
  return (
    <Link
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...rest}
    />
  );
}

/* -------------------------------- Badge ------------------------------- */

type Tone = "neutral" | "primary" | "ok" | "warn" | "bad" | "accent" | "xp" | "freq";

const badgeTones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  primary: "bg-primary-soft text-primary",
  ok: "bg-[var(--ok-soft)] text-ok",
  warn: "bg-[var(--warn-soft)] text-warn",
  bad: "bg-[var(--bad-soft)] text-bad",
  accent: "bg-accent-soft text-accent",
  xp: "bg-xp-soft text-xp",
  freq: "bg-freq-soft text-freq",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-control px-2.5 py-1 text-xs font-bold",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------ StatCard ------------------------------ */

type StatTone = "neutral" | "primary" | "ok" | "warn" | "bad" | "accent" | "xp" | "freq";

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: StatTone;
  className?: string;
}) {
  const valueColor: Record<StatTone, string> = {
    neutral: "text-text",
    primary: "text-primary",
    ok: "text-ok",
    warn: "text-warn",
    bad: "text-bad",
    accent: "text-accent",
    xp: "text-xp",
    freq: "text-freq",
  };
  return (
    <Card className={cn("p-5", className)}>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={cn("metric mt-2 text-3xl font-bold", valueColor[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </Card>
  );
}

/* ----------------------------- ProgressBar --------------------------- */

export function ProgressBar({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "ok" | "warn" | "bad" | "accent" | "xp" | "freq";
  className?: string;
}) {
  const colors = {
    primary: "bg-primary",
    ok: "bg-ok",
    warn: "bg-warn",
    bad: "bg-bad",
    accent: "bg-accent",
    xp: "bg-xp",
    freq: "bg-freq",
  };
  return (
    <div
      className={cn(
        "h-2.5 w-full overflow-hidden rounded-full bg-surface-2",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", colors[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ----------------------------- PageHeader ---------------------------- */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

/* ----------------------------- EmptyState ---------------------------- */

export function EmptyState({
  icon = "✨",
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed p-10 text-center sm:p-14">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-control bg-surface-2 text-2xl">
        {icon}
      </div>
      <p className="text-base font-bold text-text sm:text-lg">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </Card>
  );
}

/* -------------------------------- Field ------------------------------ */

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-control border border-border-strong bg-surface-2 px-3 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-faint focus:border-primary";

export const selectClass = inputClass + " cursor-pointer";
