"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHydrated, useSettings } from "@/lib/store";
import { useProgress } from "@/lib/stats";
import { useDayPlan } from "@/lib/plano";
import { formatCompact } from "@/lib/utils";
import { cn } from "@/lib/cn";
import { breadcrumb } from "@/components/shell/nav";
import { NotificationBell } from "@/components/shell/NotificationBell";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const [settings] = useSettings();
  const progress = useProgress();
  const plan = useDayPlan();

  const trail = breadcrumb(pathname);
  const name = hydrated ? settings.name.trim() : "";
  const initial = (name[0] || "V").toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Abrir menu"
        className="flex h-9 w-9 items-center justify-center rounded-control border border-border-strong bg-surface-2 text-lg md:hidden"
      >
        ☰
      </button>

      <nav aria-label="Trilha" className="flex min-w-0 flex-1 items-center text-sm">
        {trail.map((crumb, i) => (
          <span
            key={i}
            className={cn(
              "flex min-w-0 items-center",
              i === trail.length - 1 ? "font-semibold text-text" : "text-faint",
            )}
          >
            {i > 0 && <span className="mx-1.5 text-border-strong">·</span>}
            <span className="truncate">{crumb}</span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {hydrated && (
          <span className="metric hidden items-center gap-1 rounded-control bg-freq-soft px-2 py-1 text-xs font-bold text-freq sm:inline-flex">
            <span aria-hidden>🔥</span>
            {plan.daysStudiedThisWeek}
            <span className="font-semibold opacity-70">/7</span>
          </span>
        )}
        {hydrated && (
          <span className="metric hidden items-center gap-1 rounded-control bg-xp-soft px-2 py-1 text-xs font-bold text-xp sm:inline-flex">
            <span aria-hidden>⚡</span>
            {formatCompact(progress.xp)}
            <span className="font-semibold opacity-70">XP</span>
          </span>
        )}

        <NotificationBell />

        <Link
          href="/ajustes"
          aria-label="Ajustes e perfil"
          className="flex items-center gap-2 rounded-control py-1 pl-1 pr-1 transition-colors hover:bg-surface-2 sm:pr-2"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-fg">
            {initial}
          </span>
          <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-text sm:inline">
            {name || "Você"}
          </span>
        </Link>
      </div>
    </header>
  );
}
