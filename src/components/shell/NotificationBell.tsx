"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAppData, useHydrated, useSettings } from "@/lib/store";
import { useReviewQueue } from "@/lib/stats";
import { useDayPlan } from "@/lib/plano";

interface Notice {
  href: string;
  text: string;
}

/** O sino só existe quando há algo REAL para avisar:
 *  - questões da fila de revisão vencidas ("due")
 *  - tarefa do plano de hoje ainda não concluída
 *  - redação corrigida que ela ainda não abriu
 *  Sem nada disso, não renderiza nada. */
export function NotificationBell() {
  const hydrated = useHydrated();
  const { redacoes } = useAppData();
  const [settings] = useSettings();
  const queue = useReviewQueue();
  const plan = useDayPlan();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const due = queue.filter((i) => i.status === "due").length;
  const pendingTasks = plan.tasks.filter((t) => t.done < t.target).length;
  const opened = new Set(settings.openedCorrecoes ?? []);
  const unread = redacoes.filter((r) => r.correcao && !opened.has(r.id));

  const notices: Notice[] = [];
  if (due > 0) {
    notices.push({
      href: "/revisar-erros",
      text: `${due} ${due === 1 ? "questão vencida" : "questões vencidas"} para revisar`,
    });
  }
  if (pendingTasks > 0) {
    notices.push({
      href: "/plano",
      text: `${pendingTasks} ${pendingTasks === 1 ? "tarefa" : "tarefas"} do plano de hoje`,
    });
  }
  for (const r of unread) {
    notices.push({
      href: "/redacao",
      text: `Correção da redação "${r.tema || "sem tema"}" pronta`,
    });
  }

  if (!hydrated || notices.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${notices.length} ${notices.length === 1 ? "aviso" : "avisos"}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-control border border-border-strong bg-surface-2 text-base transition-colors hover:border-primary/50"
      >
        <span aria-hidden>🔔</span>
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-bg" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-card border border-border bg-surface p-1.5 shadow-[var(--shadow)]"
        >
          {notices.map((n, i) => (
            <Link
              key={i}
              href={n.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-control px-3 py-2 text-sm text-text transition-colors hover:bg-surface-2"
            >
              {n.text}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
