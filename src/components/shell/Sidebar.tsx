"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHydrated, useSettings } from "@/lib/store";
import { useReviewQueue } from "@/lib/stats";
import { useDayPlan } from "@/lib/plano";
import { cn } from "@/lib/cn";
import {
  NAV_PRIMARY,
  NAV_SECONDARY,
  isActive,
  type BadgeKind,
  type NavItem,
} from "@/components/shell/nav";
import { BrandLockup } from "@/components/shell/Brand";
import { openCommandPalette } from "@/components/shell/commandBus";
import { type Theme } from "@/lib/theme";

const NEXT_THEME: Record<Theme, Theme> = {
  dark: "light",
  light: "system",
  system: "dark",
};
const THEME_ICON: Record<Theme, string> = {
  dark: "🌙",
  light: "☀️",
  system: "🖥️",
};
const THEME_LABEL: Record<Theme, string> = {
  dark: "escuro",
  light: "claro",
  system: "automático",
};

function useBadges(): Record<BadgeKind, number> {
  const hydrated = useHydrated();
  const plan = useDayPlan();
  const queue = useReviewQueue();
  if (!hydrated) return { plano: 0, revisar: 0 };
  return {
    plano: plan.tasks.filter((t) => t.done < t.target).length,
    revisar: queue.filter((i) => i.status === "due").length,
  };
}

function NavRow({
  item,
  active,
  collapsed,
  badgeCount,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badgeCount: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-control px-3 py-2 text-sm font-semibold transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary-soft text-primary"
          : "text-muted hover:bg-surface-2 hover:text-text",
      )}
    >
      <span className="text-base leading-none">{item.icon}</span>
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {badgeCount > 0 &&
        (collapsed ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        ) : (
          <span className="metric rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-fg">
            {badgeCount}
          </span>
        ))}
    </Link>
  );
}

function SearchButton({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      title="Buscar (Ctrl+K)"
      className={cn(
        "flex w-full items-center gap-2 rounded-control border border-border-strong bg-surface-2 px-3 py-2 text-sm text-faint transition-colors hover:border-primary/50",
        collapsed && "justify-center px-0",
      )}
    >
      <span aria-hidden>🔍</span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left">Buscar</span>
          <kbd className="rounded border border-border-strong px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            ⌘K
          </kbd>
        </>
      )}
    </button>
  );
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const [settings, update] = useSettings();
  const hydrated = useHydrated();
  const theme = (hydrated ? settings.theme : "dark") as Theme;
  return (
    <button
      type="button"
      onClick={() => update({ theme: NEXT_THEME[theme] })}
      aria-label={`Tema: ${THEME_LABEL[theme]}. Trocar.`}
      title={`Tema: ${THEME_LABEL[theme]}`}
      className={cn(
        "flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text",
        collapsed ? "w-full justify-center px-0" : "w-full",
      )}
    >
      <span aria-hidden>{THEME_ICON[theme]}</span>
      {!collapsed && <span className="flex-1 text-left">Tema: {THEME_LABEL[theme]}</span>}
    </button>
  );
}

/** Conteúdo compartilhado entre a sidebar fixa e o drawer mobile. */
function NavBody({
  collapsed,
  onNavigate,
  footerExtra,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  footerExtra?: React.ReactNode;
}) {
  const pathname = usePathname();
  const badges = useBadges();

  return (
    <>
      <div className={cn("px-3 pb-2", collapsed && "px-2")}>
        <SearchButton collapsed={collapsed} />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
        {NAV_PRIMARY.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            collapsed={collapsed}
            badgeCount={item.badge ? badges[item.badge] : 0}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      <div className="space-y-0.5 border-t border-border px-3 py-2">
        {NAV_SECONDARY.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            collapsed={collapsed}
            badgeCount={0}
            onNavigate={onNavigate}
          />
        ))}
        <ThemeToggle collapsed={collapsed} />
        {footerExtra}
      </div>
    </>
  );
}

/* --------------------------- Sidebar desktop --------------------------- */

export function Sidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-[100dvh] shrink-0 flex-col border-r border-border bg-surface md:flex",
        collapsed ? "w-16" : "w-[248px]",
      )}
    >
      <div className={cn("flex h-14 items-center px-4", collapsed && "justify-center px-2")}>
        <Link href="/" aria-label="Início">
          <BrandLockup collapsed={collapsed} />
        </Link>
      </div>
      <NavBody
        collapsed={collapsed}
        footerExtra={
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir" : "Recolher"}
            className={cn(
              "flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-faint transition-colors hover:bg-surface-2 hover:text-text",
              collapsed ? "w-full justify-center px-0" : "w-full",
            )}
          >
            <span aria-hidden>{collapsed ? "»" : "«"}</span>
            {!collapsed && <span className="flex-1 text-left">Recolher</span>}
          </button>
        }
      />
    </aside>
  );
}

/* ---------------------------- Drawer mobile ---------------------------- */

export function SidebarDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="md:hidden">
      <button
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className="fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-xs flex-col border-r border-border bg-surface"
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" aria-label="Início" onClick={onClose}>
            <BrandLockup />
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex h-9 w-9 items-center justify-center rounded-control border border-border-strong text-lg"
          >
            ✕
          </button>
        </div>
        <NavBody collapsed={false} onNavigate={onClose} />
      </div>
    </div>
  );
}
