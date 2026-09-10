"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/store";
import { ENEM_AREAS, ALL_TOPICS } from "@/lib/enem";
import { RESUMOS } from "@/lib/resumos";
import { cn } from "@/lib/cn";
import { NAV_PRIMARY, NAV_SECONDARY } from "@/components/shell/nav";
import { COMMAND_EVENT } from "@/components/shell/commandBus";

interface Result {
  group: string;
  icon: string;
  label: string;
  sub?: string;
  href: string;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function areaOf(topic: string): { name: string; short: string } | null {
  const a = ENEM_AREAS.find((ar) => ar.topics.includes(topic));
  return a ? { name: a.name, short: a.short } : null;
}

export function CommandPalette() {
  const router = useRouter();
  const { questions, favorites } = useAppData();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const show = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);
  const hide = useCallback(() => setOpen(false), []);

  // abrir: ⌘K / Ctrl+K ou evento do botão de busca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (openRef.current) hide();
        else show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_EVENT, show);
    };
  }, [show, hide]);

  // efeito só de DOM (bloqueio de scroll + foco) — sem setState aqui
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const favSet = useMemo(() => new Set(favorites), [favorites]);

  const results = useMemo<Result[]>(() => {
    const q = norm(query.trim());

    const routes: Result[] = [...NAV_PRIMARY, ...NAV_SECONDARY].map((n) => ({
      group: "Ir para",
      icon: n.icon,
      label: n.label,
      href: n.href,
    }));

    const topics: Result[] = ALL_TOPICS.map((t) => {
      const a = areaOf(t);
      return {
        group: "Assuntos",
        icon: "🎯",
        label: t,
        sub: a?.short,
        href: `/simulado?area=${encodeURIComponent(a?.name ?? "TODAS")}&topic=${encodeURIComponent(t)}`,
      };
    });

    const resumos: Result[] = RESUMOS.map((r) => ({
      group: "Resumos",
      icon: "📄",
      label: r.topic,
      sub: "resumo de 1 tela",
      href: `/resumos?t=${encodeURIComponent(r.topic)}`,
    }));

    const favs: Result[] = questions
      .filter((question) => favSet.has(question.id))
      .map((question) => ({
        group: "Favoritas",
        icon: "⭐",
        label: question.statement.slice(0, 70) || "Questão favorita",
        sub: question.topic || undefined,
        href: "/favoritas",
      }));

    const all = [...routes, ...topics, ...resumos, ...favs];
    if (!q) return routes;

    return all
      .filter(
        (r) => norm(r.label).includes(q) || (r.sub ? norm(r.sub).includes(q) : false),
      )
      .slice(0, 40);
  }, [query, questions, favSet]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const go = (r: Result | undefined) => {
    if (!r) return;
    setOpen(false);
    router.push(r.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  };

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center bg-black/50 p-4 pt-[10vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar no app"
        className="w-full max-w-lg overflow-hidden rounded-card border border-border bg-surface shadow-[var(--shadow)]"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <span aria-hidden className="text-faint">
            🔍
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Buscar assuntos, resumos, favoritas, telas…"
            className="w-full bg-transparent py-3.5 text-sm text-text outline-none placeholder:text-faint"
            aria-label="Buscar"
            role="combobox"
            aria-expanded="true"
            aria-controls="ea-cmd-list"
          />
          <kbd className="rounded border border-border-strong px-1.5 py-0.5 text-[10px] font-semibold text-faint">
            Esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id="ea-cmd-list"
          role="listbox"
          className="max-h-[60vh] overflow-y-auto p-1.5"
        >
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-faint">
              Nada encontrado para “{query}”.
            </p>
          ) : (
            results.map((r, i) => {
              const header = r.group !== lastGroup ? r.group : null;
              lastGroup = r.group;
              return (
                <div key={`${r.href}-${i}`}>
                  {header && (
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                      {header}
                    </p>
                  )}
                  <button
                    type="button"
                    data-idx={i}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-control px-3 py-2 text-left text-sm transition-colors",
                      i === active ? "bg-primary-soft text-primary" : "text-text",
                    )}
                  >
                    <span aria-hidden className="text-base">
                      {r.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{r.label}</span>
                    {r.sub && (
                      <span className="shrink-0 text-xs text-faint">{r.sub}</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
