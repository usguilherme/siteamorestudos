"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHydrated, useSettings } from "@/lib/store";
import { applyTheme, type Theme } from "@/lib/theme";
import { greeting } from "@/lib/messages";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/simulado", label: "Simulado", icon: "📝" },
  { href: "/redacao", label: "Redação", icon: "✍️" },
  { href: "/desempenho", label: "Desempenho", icon: "📊" },
  { href: "/revisar-erros", label: "Revisar erros", icon: "🔁" },
  { href: "/diagnostico", label: "Prioridades", icon: "🎯" },
];

// só no menu mobile / secundário
const NAV_EXTRA = [
  { href: "/materias", label: "Matérias", icon: "📚" },
  { href: "/favoritas", label: "Favoritas", icon: "⭐" },
  { href: "/historico", label: "Histórico", icon: "🕘" },
];

const NEXT_THEME: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const THEME_ICON: Record<Theme, string> = {
  light: "☀️",
  dark: "🌙",
  system: "🖥️",
};

/** Aplica o tema sempre que a configuração muda e acompanha o "system". */
export function ThemeSync() {
  const [settings] = useSettings();
  const theme = settings.theme;

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return null;
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}

function ThemeToggle() {
  const [settings, update] = useSettings();
  const theme = settings.theme;
  return (
    <button
      type="button"
      onClick={() => update({ theme: NEXT_THEME[theme] })}
      title={`Tema: ${theme}`}
      aria-label={`Alternar tema (atual: ${theme})`}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-strong bg-surface text-base transition hover:bg-surface-2"
    >
      {THEME_ICON[theme]}
    </button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [settings] = useSettings();
  const hydrated = useHydrated();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-extrabold text-text">
          <span className="text-xl">📚</span>
          <span className="hidden sm:inline">Estudos do Amor</span>
          <span className="text-accent">❤️</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition",
                isActive(item.href)
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-surface-2 hover:text-text",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {hydrated && settings.name ? (
            <span className="hidden text-sm font-semibold text-muted xl:inline">
              {greeting(settings.name)} 💛
            </span>
          ) : null}
          <ThemeToggle />
          <Link
            href="/ajustes"
            aria-label="Ajustes"
            className="hidden h-9 w-9 items-center justify-center rounded-xl border border-border-strong bg-surface text-base transition hover:bg-surface-2 sm:flex"
          >
            ⚙️
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-strong bg-surface lg:hidden"
          >
            <span className="text-lg">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="lg:hidden">
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <nav className="absolute inset-x-0 top-full z-50 max-h-[80dvh] overflow-y-auto border-b border-border bg-surface p-3 shadow-[var(--shadow)]">
            {[
              ...NAV,
              ...NAV_EXTRA,
              { href: "/admin/nova-questao", label: "Admin", icon: "🛠️" },
              { href: "/ajustes", label: "Ajustes", icon: "⚙️" },
            ].map(
              (item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                    isActive(item.href) && item.href !== "/admin/nova-questao"
                      ? "bg-primary-soft text-primary"
                      : "text-text hover:bg-surface-2",
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-6 text-center text-xs text-faint">
      Feito com dedicação e amor para os seus estudos ❤️ · {new Date().getFullYear()}
    </footer>
  );
}
