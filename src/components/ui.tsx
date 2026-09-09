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
        "rounded-2xl border border-border bg-surface shadow-[var(--shadow)]",
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
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-fg hover:bg-primary-hover shadow-[0_6px_20px_-8px_var(--primary)]",
  accent: "bg-accent text-white hover:opacity-90 shadow-[0_6px_20px_-8px_var(--accent)]",
  secondary:
    "border border-border-strong bg-surface text-text hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
  danger: "border border-[var(--bad)]/30 bg-[var(--bad-soft)] text-bad hover:bg-[var(--bad)]/15",
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

type Tone = "neutral" | "primary" | "ok" | "warn" | "bad" | "accent";

const badgeTones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  primary: "bg-primary-soft text-primary",
  ok: "bg-[var(--ok-soft)] text-ok",
  warn: "bg-[var(--warn-soft)] text-warn",
  bad: "bg-[var(--bad-soft)] text-bad",
  accent: "bg-accent-soft text-accent",
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------ StatCard ------------------------------ */

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
  tone?: Tone;
  className?: string;
}) {
  const valueColor: Record<Tone, string> = {
    neutral: "text-text",
    primary: "text-primary",
    ok: "text-ok",
    warn: "text-warn",
    bad: "text-bad",
    accent: "text-accent",
  };
  return (
    <Card className={cn("p-5", className)}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
        {label}
      </p>
      <p className={cn("mt-2 text-3xl font-extrabold tracking-tight", valueColor[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
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
  tone?: "primary" | "ok" | "warn" | "bad" | "accent";
  className?: string;
}) {
  const colors = {
    primary: "bg-primary",
    ok: "bg-ok",
    warn: "bg-warn",
    bad: "bg-bad",
    accent: "bg-accent",
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
        <h1 className="text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
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
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-2xl">
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
  "w-full rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-sm text-text shadow-sm outline-none transition placeholder:text-faint focus:border-primary";

export const selectClass = inputClass + " cursor-pointer";
