"use client";

import Link from "next/link";
import { useHydrated, useSettings } from "@/lib/store";
import { useDayPlan } from "@/lib/plano";
import { greeting } from "@/lib/messages";
import { cn } from "@/lib/cn";
import { Card, PageHeader, ProgressBar } from "@/components/ui";

const ICON: Record<string, string> = {
  revisao: "🔁",
  questoes: "📝",
  redacao: "✍️",
  resumo: "📄",
};

export default function PlanoPage() {
  const hydrated = useHydrated();
  const [settings] = useSettings();
  const plan = useDayPlan();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Plano de hoje 🗓️"
        subtitle={hydrated ? `${greeting(settings.name)} — foco no que rende mais ponto.` : " "}
      />

      {/* Semana — sem "streak que quebra" */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text">
            Você estudou{" "}
            <span className="text-primary">{plan.daysStudiedThisWeek} de 7</span> dias
          </p>
          {plan.daysToEnem !== null ? (
            <p className="text-xs text-muted">{plan.daysToEnem} dias pro ENEM</p>
          ) : null}
        </div>
        <div className="mt-3 flex gap-1.5">
          {plan.week.map((d) => (
            <div key={d.key} className="flex-1 text-center">
              <div
                className={cn(
                  "mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
                  d.studied
                    ? "bg-ok text-white"
                    : d.isToday
                      ? "border-2 border-primary text-primary"
                      : "bg-surface-2 text-faint",
                )}
              >
                {d.studied ? "✓" : d.isToday ? "•" : ""}
              </div>
              <p className="mt-1 text-[10px] capitalize text-faint">{d.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-faint">
          Faltou um dia? Sem culpa — o plano se ajusta sozinho amanhã.
        </p>
      </Card>

      {hydrated && plan.allDone ? (
        <Card className="border-ok/40 bg-[var(--ok-soft)] p-5 text-center">
          <p className="text-3xl">🎉</p>
          <p className="mt-1 font-bold text-text">Plano de hoje concluído!</p>
          <p className="text-sm text-muted">
            Se quiser continuar, é lucro. Senão, descanso também faz parte.
          </p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {plan.tasks.map((t) => {
          const pct = t.target ? Math.round((t.done / t.target) * 100) : 0;
          const complete = t.done >= t.target;
          return (
            <Link
              key={t.id}
              href={t.href}
              className={cn(
                "block rounded-2xl border p-4 shadow-[var(--shadow)] transition hover:-translate-y-0.5",
                complete ? "border-ok/40 bg-[var(--ok-soft)]" : "border-border bg-surface",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{complete ? "✅" : ICON[t.kind]}</span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-bold",
                      complete ? "text-ok line-through" : "text-text",
                    )}
                  >
                    {t.title}
                  </p>
                  <p className="text-xs text-muted">{t.detail}</p>
                  {t.target > 1 ? (
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar
                        value={pct}
                        tone={complete ? "ok" : "primary"}
                        className="h-1.5"
                      />
                      <span className="shrink-0 text-[11px] font-semibold text-faint">
                        {t.done}/{t.target}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}

        {hydrated && plan.tasks.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted">
            Assim que tiver questões no banco e alguns simulados feitos, o plano do dia
            aparece aqui.
          </Card>
        ) : null}
      </div>
    </div>
  );
}
