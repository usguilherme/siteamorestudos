"use client";

import { useSettings, useHydrated } from "@/lib/store";
import { daysUntil } from "@/lib/stats";
import { Card } from "@/components/ui";

export function nextEnemDate(dates: string[]): { date: string; days: number } | null {
  const sorted = [...dates].filter(Boolean).sort();
  if (!sorted.length) return null;
  for (const d of sorted) {
    const days = daysUntil(d);
    if (days >= 0) return { date: d, days };
  }
  const last = sorted[sorted.length - 1];
  return { date: last, days: daysUntil(last) };
}

export function EnemCountdown() {
  const hydrated = useHydrated();
  const [settings] = useSettings();
  const next = nextEnemDate(settings.enemDates);

  if (!hydrated || !next) return null;

  const formatted = new Date(next.date + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const passed = next.days < 0;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-accent p-5 text-white sm:p-6">
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <p className="text-xs font-bold uppercase tracking-wider text-white/80">
        {passed ? "ENEM" : "Contagem regressiva pro ENEM"}
      </p>
      {passed ? (
        <p className="mt-2 text-2xl font-extrabold">É agora. Você se preparou pra isso. 💛</p>
      ) : (
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tabular-nums sm:text-5xl">
            {next.days}
          </span>
          <span className="text-lg font-semibold text-white/90">
            {next.days === 1 ? "dia" : "dias"}
          </span>
        </p>
      )}
      <p className="mt-1 text-sm text-white/85">Prova em {formatted}</p>
    </Card>
  );
}
