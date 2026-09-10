"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useAppData, useHydrated, useSettings } from "@/lib/store";
import {
  useProgress,
  useStats,
  useWeeklyWindow,
  dateKey,
  type WeeklyWindow,
} from "@/lib/stats";
import { useDayPlan } from "@/lib/plano";
import { greeting } from "@/lib/messages";
import { formatCompact, formatDuration } from "@/lib/utils";
import { ENEM_AREAS } from "@/lib/enem";
import { cn } from "@/lib/cn";
import { ButtonLink, Card, ProgressBar } from "@/components/ui";

/* -------------------------------- Hero -------------------------------- */

export function Hero() {
  const hydrated = useHydrated();
  const [settings] = useSettings();
  const progress = useProgress();
  const plan = useDayPlan();

  const daysToEnem = plan.daysToEnem;
  const enemUrgent = daysToEnem !== null && daysToEnem <= 60;

  let context: string;
  if (!hydrated) {
    context = " ";
  } else if (enemUrgent) {
    context = `Faltam ${daysToEnem} ${daysToEnem === 1 ? "dia" : "dias"} para o ENEM.`;
  } else if (progress.nextLevelName) {
    context = `Faltam ${formatCompact(progress.xpToNext)} XP para o nível ${progress.level + 1} · ${progress.nextLevelName}.`;
  } else if (daysToEnem !== null) {
    context = `Faltam ${daysToEnem} dias para o ENEM.`;
  } else {
    context = "Cada questão respondida vira XP. Um dia de cada vez.";
  }

  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted">
          {hydrated ? greeting(settings.name) : " "}
        </p>
        <h1 className="mt-1 text-[clamp(1.9rem,4vw,2.6rem)] font-bold leading-[1.05] tracking-tight text-text">
          Pronta pra acelerar?
        </h1>
        <p className="metric mt-2 text-sm text-muted">{context}</p>
      </div>
      <ButtonLink href="/simulado?auto=1" size="lg" className="shrink-0">
        Iniciar simulado rápido
      </ButtonLink>
    </section>
  );
}

/* --------------------------- Card de destaque ------------------------- */

export function SpotlightCard() {
  const hydrated = useHydrated();
  const { attempts } = useAppData();
  const plan = useDayPlan();
  const progress = useProgress();

  const minutesToday = useMemo(() => {
    const k = dateKey(new Date());
    const secs = attempts
      .filter((a) => dateKey(a.createdAt) === k)
      .reduce((s, a) => s + (a.timeSpent || 0), 0);
    return Math.round(secs / 60);
  }, [attempts]);

  const task = hydrated
    ? plan.tasks.find((t) => t.done < t.target) ?? null
    : null;

  const levelPanel = (
    <div className="rounded-card bg-white/10 p-4 sm:w-52">
      <p className="text-xs font-semibold text-white/75">
        Nível {progress.level} · {progress.levelName}
      </p>
      <p className="metric mt-1 text-2xl font-bold text-white">
        {formatCompact(progress.xp)}
        <span className="ml-1 text-sm font-semibold text-white/70">XP</span>
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${progress.pct}%` }}
        />
      </div>
      <p className="metric mt-1.5 text-[11px] text-white/70">
        {progress.nextLevelName
          ? `faltam ${formatCompact(progress.xpToNext)} XP`
          : "nível máximo"}
      </p>
    </div>
  );

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary-deep p-6 text-white">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">
            {task ? "Continuar de onde parou" : "Seu plano de hoje"}
          </p>

          {task ? (
            <>
              <h2 className="mt-1 text-xl font-bold leading-tight">{task.title}</h2>
              <p className="metric mt-1 text-sm text-white/80">
                {task.done}/{task.target} · {minutesToday} min hoje
              </p>
              <div className="mt-3 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((task.done / task.target) * 100))}%`,
                  }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={task.href}
                  className="rounded-control bg-white px-5 py-2.5 text-sm font-bold text-primary transition-transform active:scale-[0.98]"
                >
                  Continuar
                </Link>
                <Link
                  href="/plano"
                  className="rounded-control border border-white/40 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  Ver meu plano
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-1 text-xl font-bold leading-tight">
                {hydrated && plan.allDone
                  ? "Tudo feito por hoje 💛"
                  : "Começar o plano de hoje"}
              </h2>
              <p className="mt-1 text-sm text-white/80">
                {hydrated && plan.allDone
                  ? "Você cumpriu todas as tarefas de hoje. Descansa que amanhã tem mais."
                  : "Uma lista curta, montada pelo que mais rende ponto pra você agora."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/plano"
                  className="rounded-control bg-white px-5 py-2.5 text-sm font-bold text-primary transition-transform active:scale-[0.98]"
                >
                  {hydrated && plan.allDone ? "Rever o plano" : "Começar o plano de hoje"}
                </Link>
                <Link
                  href="/simulado?auto=1"
                  className="rounded-control border border-white/40 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  Simulado avulso
                </Link>
              </div>
            </>
          )}
        </div>

        {levelPanel}
      </div>
    </Card>
  );
}

/* ------------------------------ Faixa KPI ----------------------------- */

function Kpi({
  label,
  value,
  sub,
  tone = "text",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "text" | "primary" | "xp" | "freq";
}) {
  const color = {
    text: "text-text",
    primary: "text-primary",
    xp: "text-xp",
    freq: "text-freq",
  }[tone];
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={cn("metric mt-1.5 text-2xl font-bold sm:text-3xl", color)}>{value}</p>
      <p className="mt-1 text-xs text-faint">{sub}</p>
    </Card>
  );
}

export function KpiRow() {
  const hydrated = useHydrated();
  const w = useWeeklyWindow();

  if (!hydrated) {
    return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi
        label="Aproveitamento"
        value={w.accuracy === null ? "—" : `${w.accuracy}%`}
        sub={
          w.answered === 0
            ? "sem questões nos últimos 7 dias"
            : `${w.correct} de ${w.answered} acertos`
        }
        tone="primary"
      />
      <Kpi
        label="Questões resolvidas"
        value={String(w.answered)}
        sub="últimos 7 dias"
      />
      <Kpi
        label="Tempo de estudo"
        value={w.studySeconds === 0 ? "—" : formatDuration(w.studySeconds)}
        sub={w.studySeconds === 0 ? "sem tempo registrado" : "últimos 7 dias"}
      />
      <Kpi
        label="vs. sua média"
        value={
          w.accuracyDelta === null
            ? "—"
            : `${w.accuracyDelta >= 0 ? "+" : "−"}${Math.abs(w.accuracyDelta)}pp`
        }
        sub={
          w.accuracyDelta === null
            ? "poucas semanas de histórico"
            : `média anterior ${w.prevAvgAccuracy}%`
        }
        tone="freq"
      />
    </div>
  );
}

/* ------------------------- Atividade diária + Metas ------------------- */

function ActivityChart({ w }: { w: WeeklyWindow }) {
  const data = w.bars.map((b) => ({ ...b }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="letter"
          stroke="var(--faint)"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
            color: "var(--text)",
          }}
          formatter={((v: number) => [`${v} questões`, "no dia"]) as never}
          labelFormatter={() => ""}
        />
        {w.avgPerDay > 0 && (
          <ReferenceLine
            y={w.avgPerDay}
            stroke="var(--faint)"
            strokeDasharray="4 4"
            label={{
              value: `média ${w.avgPerDay}`,
              position: "insideTopRight",
              fill: "var(--faint)",
              fontSize: 10,
            }}
          />
        )}
        <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={40}>
          {data.map((d) => (
            <Cell
              key={d.key}
              fill={d.isToday ? "var(--primary)" : "var(--primary-soft)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeeklyActivity() {
  const hydrated = useHydrated();
  const w = useWeeklyWindow();

  return (
    <Card className="p-5">
      <h2 className="text-sm font-bold text-text">Atividade diária</h2>
      <p className="text-xs text-faint">últimos 7 dias</p>
      <div className="mt-3">
        {!hydrated ? (
          <div className="h-[200px]" />
        ) : w.answered === 0 ? (
          <p className="flex h-[200px] items-center justify-center text-center text-sm text-faint">
            Nenhuma questão nos últimos 7 dias. Comece pelo plano de hoje.
          </p>
        ) : (
          <ActivityChart w={w} />
        )}
      </div>
    </Card>
  );
}

export function GoalsPanel() {
  const hydrated = useHydrated();
  const [settings] = useSettings();
  const stats = useStats();
  const plan = useDayPlan();
  const w = useWeeklyWindow();

  const daily = Math.max(5, settings.dailyGoal || 15);
  const weekly = daily * 7;

  const rows = [
    {
      label: "Meta diária",
      done: hydrated ? stats.todayCount : 0,
      target: daily,
      unit: "questões",
    },
    {
      label: "Meta da semana",
      done: hydrated ? w.answered : 0,
      target: weekly,
      unit: "questões",
    },
    {
      label: "Dias estudados",
      done: hydrated ? plan.daysStudiedThisWeek : 0,
      target: 7,
      unit: "dias",
    },
  ];

  return (
    <Card className="flex flex-col p-5">
      <h2 className="text-sm font-bold text-text">Suas metas</h2>
      <p className="text-xs text-faint">só contra você mesma</p>
      <div className="mt-3 space-y-3.5">
        {rows.map((r) => {
          const pct = Math.min(100, Math.round((r.done / r.target) * 100));
          return (
            <div key={r.label}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">{r.label}</span>
                <span className="metric text-sm font-bold text-text">
                  {r.done}
                  <span className="font-semibold text-faint">/{r.target}</span>
                </span>
              </div>
              <ProgressBar className="mt-1.5" value={pct} tone={pct >= 100 ? "freq" : "primary"} />
            </div>
          );
        })}
      </div>
      <p className="metric mt-4 border-t border-border pt-3 text-xs text-faint">
        {!hydrated || w.accuracyDelta === null
          ? "Ainda montando seu histórico das últimas semanas."
          : w.accuracyDelta >= 0
            ? `Seu acerto desta semana está ${w.accuracyDelta}pp acima da sua média.`
            : `Seu acerto desta semana está ${Math.abs(w.accuracyDelta)}pp abaixo da sua média — normal, segue.`}
      </p>
    </Card>
  );
}

/* ------------------------- Pratique por matéria ---------------------- */

export function PracticeByArea() {
  const hydrated = useHydrated();
  const stats = useStats();

  const areas = useMemo(() => {
    const byName = new Map(stats.byArea.map((a) => [a.name, a]));
    return ENEM_AREAS.map((area) => {
      const s = byName.get(area.name);
      return {
        name: area.name,
        short: area.short,
        emoji: area.emoji,
        total: s?.total ?? 0,
        accuracy: s && s.total > 0 ? s.accuracy : null,
      };
    }).sort((a, b) => {
      const av = a.accuracy ?? 999;
      const bv = b.accuracy ?? 999;
      return av - bv;
    });
  }, [stats.byArea]);

  return (
    <section>
      <h2 className="text-sm font-bold text-text">Pratique por matéria</h2>
      <p className="text-xs text-faint">as mais fracas primeiro</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {areas.map((a) => (
          <Link
            key={a.name}
            href={`/simulado?area=${encodeURIComponent(a.name)}`}
            className="rounded-card border border-border bg-surface p-4 transition-colors hover:border-primary/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg" aria-hidden>
                {a.emoji}
              </span>
              <span className="metric text-sm font-bold text-text">
                {!hydrated || a.accuracy === null ? "—" : `${a.accuracy}%`}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-text">{a.short}</p>
            <p className="mt-0.5 text-xs text-faint">
              {!hydrated || a.total === 0
                ? "sem questões ainda"
                : `${a.total} ${a.total === 1 ? "questão" : "questões"}`}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
