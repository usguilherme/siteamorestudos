"use client";

import Link from "next/link";
import { useHydrated, useSettings } from "@/lib/store";
import { useScoreEstimate, useStats } from "@/lib/stats";
import {
  AreaBarChart,
  ReasonPieChart,
  TimelineChart,
} from "@/components/PerformanceCharts";
import { formatTime } from "@/lib/utils";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
  StatCard,
} from "@/components/ui";

export default function DesempenhoPage() {
  const hydrated = useHydrated();
  const stats = useStats();
  const estimate = useScoreEstimate();
  const [settings] = useSettings();

  if (hydrated && stats.totalAttempts === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Desempenho 📊" subtitle="Sua evolução, ponto a ponto." />
        <EmptyState
          icon="📈"
          title="Ainda não há dados"
          description="Faça um simulado pra começar a ver seus gráficos de acerto, evolução e pontos a revisar."
          action={<ButtonLink href="/simulado">Fazer um simulado</ButtonLink>}
        />
      </div>
    );
  }

  const goalPct = settings.dailyGoal
    ? Math.round((stats.todayCount / settings.dailyGoal) * 100)
    : 0;

  const strongest = stats.byTopic.filter((t) => t.total >= 3).at(-1);
  const weakest = stats.byTopic.filter((t) => t.total >= 3)[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Desempenho 📊"
        subtitle="Sua evolução, ponto a ponto."
        action={<ButtonLink href="/simulado" size="sm">Novo simulado</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Aproveitamento"
          value={`${stats.accuracy}%`}
          hint={`${stats.correct} acertos · ${stats.incorrect} erros`}
        />
        <StatCard
          label="Questões únicas"
          value={stats.uniqueAnswered}
          hint={`${stats.coverage}% do banco (${stats.totalQuestions})`}
          tone="neutral"
        />
        <StatCard
          label="Sequência"
          value={`${stats.streak} 🔥`}
          hint={`${stats.activeDays} dias ativos`}
          tone="accent"
        />
        <StatCard
          label="Tempo médio"
          value={stats.avgTime ? formatTime(stats.avgTime) : "—"}
          hint="por questão"
          tone="neutral"
        />
      </div>

      {/* nota estimada */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-faint">
              Nota estimada (objetivas)
            </p>
            <p className="mt-1 text-3xl font-extrabold text-primary">
              {estimate.overall ?? "—"}
              {estimate.overall !== null ? (
                <span className="text-base font-semibold text-muted"> / 1000</span>
              ) : null}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {estimate.byArea
              .filter((a) => a.score !== null)
              .map((a) => (
                <div key={a.name} className="rounded-lg bg-surface-2 px-3 py-1.5 text-center">
                  <p className="text-[11px] text-faint">{a.short}</p>
                  <p className="text-sm font-bold text-text">{a.score}</p>
                </div>
              ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-faint">{estimate.note}</p>
      </Card>

      {/* meta */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text">Meta de hoje</h2>
          <span className="text-sm font-semibold text-muted">
            {stats.todayCount} / {settings.dailyGoal}
          </span>
        </div>
        <ProgressBar
          className="mt-3"
          value={goalPct}
          tone={stats.todayCount >= settings.dailyGoal ? "ok" : "primary"}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-bold text-text">Evolução do acerto</h2>
          <TimelineChart data={stats.timeline} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-bold text-text">Acerto por área</h2>
          <AreaBarChart data={stats.byArea} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-bold text-text">Motivos dos erros</h2>
          <ReasonPieChart data={stats.byReason} />
          {stats.byReason.length > 0 ? (
            <ul className="mt-3 space-y-1 text-xs text-muted">
              {stats.byReason.map((r) => (
                <li key={r.reason} className="flex justify-between">
                  <span>{r.reason}</span>
                  <span className="font-semibold text-text">{r.count}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-bold text-text">Pontos fortes e fracos</h2>
          {weakest ? (
            <div className="space-y-3 text-sm">
              <div>
                <Badge tone="bad">A revisar</Badge>
                <p className="mt-1 font-semibold text-text">{weakest.topic}</p>
                <p className="text-xs text-muted">
                  {weakest.accuracy}% de acerto em {weakest.total} questões
                </p>
              </div>
              {strongest && strongest.topic !== weakest.topic ? (
                <div>
                  <Badge tone="ok">Mandando bem</Badge>
                  <p className="mt-1 font-semibold text-text">{strongest.topic}</p>
                  <p className="text-xs text-muted">
                    {strongest.accuracy}% de acerto em {strongest.total} questões
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Responda mais questões (pelo menos 3 por assunto) pra gente identificar padrões.
            </p>
          )}
        </Card>
      </div>

      {/* por assunto */}
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-bold text-text">
          Todos os assuntos <span className="font-normal text-faint">(pior → melhor)</span>
        </h2>
        <div className="space-y-3">
          {stats.byTopic.map((t) => (
            <div key={t.topic}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-text">{t.topic}</span>
                <span className="shrink-0 text-xs text-muted">
                  {t.correct}/{t.total} · <strong className="text-text">{t.accuracy}%</strong>
                </span>
              </div>
              <ProgressBar
                value={t.accuracy}
                tone={t.accuracy >= 70 ? "ok" : t.accuracy >= 40 ? "primary" : "warn"}
              />
            </div>
          ))}
          {stats.byTopic.length === 0 ? (
            <p className="text-sm text-muted">Nenhum assunto registrado ainda.</p>
          ) : null}
        </div>
      </Card>

      <p className="text-center text-xs text-faint">
        <Link href="/historico" className="hover:text-muted">
          Ver histórico completo →
        </Link>
      </p>
    </div>
  );
}
