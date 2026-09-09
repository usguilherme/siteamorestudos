"use client";

import Link from "next/link";
import { useHydrated, useSettings } from "@/lib/store";
import { useStats } from "@/lib/stats";
import { useDayPlan } from "@/lib/plano";
import { greeting } from "@/lib/messages";
import { EnemCountdown } from "@/components/Countdown";
import {
  Badge,
  ButtonLink,
  Card,
  ProgressBar,
} from "@/components/ui";

const FEATURES = [
  {
    href: "/simulado",
    icon: "📝",
    title: "Simulado",
    desc: "Treino, prova ou o formato real: 90 questões e 5h30 de cronômetro.",
  },
  {
    href: "/redacao",
    icon: "✍️",
    title: "Redação",
    desc: "Escreva e receba correção pelas 5 competências, com temas e repertório.",
  },
  {
    href: "/diagnostico",
    icon: "🎯",
    title: "Prioridades",
    desc: "O que rende mais ponto: alta incidência no ENEM + seu ponto fraco.",
  },
  {
    href: "/desempenho",
    icon: "📊",
    title: "Desempenho",
    desc: "Gráficos de evolução, nota estimada e pontos fortes e fracos.",
  },
  {
    href: "/revisar-erros",
    icon: "🔁",
    title: "Revisar erros",
    desc: "Fila de revisão espaçada com o que você errou e ainda não recuperou.",
  },
  {
    href: "/resumos",
    icon: "📄",
    title: "Resumos",
    desc: "Uma tela por assunto: o essencial, as fórmulas e a pegadinha.",
  },
];

export default function HomePage() {
  const hydrated = useHydrated();
  const [settings] = useSettings();
  const stats = useStats();
  const plan = useDayPlan();

  const goalPct = settings.dailyGoal
    ? Math.round((stats.todayCount / settings.dailyGoal) * 100)
    : 0;
  const goalDone = stats.todayCount >= settings.dailyGoal;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="animate-fade-up space-y-2">
        <p className="text-sm font-semibold text-muted">
          {hydrated ? `${greeting(settings.name)} 💛` : " "}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Pronta pra dar mais um passo rumo à aprovação?
        </h1>
        <p className="max-w-2xl text-muted">
          Escolha um simulado, entenda seus erros e acompanhe sua evolução. Um dia
          de cada vez.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/plano" size="lg">
            Ver plano de hoje 🗓️
          </ButtonLink>
          <ButtonLink href="/simulado" variant="secondary" size="lg">
            Simulado avulso
          </ButtonLink>
        </div>
      </section>

      {hydrated && plan.tasks.length > 0 ? (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-faint">
              Plano de hoje
            </p>
            {plan.allDone ? <Badge tone="ok">✅ concluído</Badge> : null}
          </div>
          <ul className="mt-3 space-y-1.5">
            {plan.tasks.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <span>{t.done >= t.target ? "✅" : "⬜"}</span>
                <span
                  className={
                    t.done >= t.target ? "text-faint line-through" : "text-text"
                  }
                >
                  {t.title}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/plano"
            className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
          >
            Abrir plano completo →
          </Link>
        </Card>
      ) : null}

      {/* Cards de status */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <EnemCountdown />

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-faint">
              Meta de hoje
            </p>
            {hydrated && goalDone ? <Badge tone="ok">✅ concluída</Badge> : null}
          </div>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tabular-nums text-text">
              {hydrated ? stats.todayCount : 0}
            </span>
            <span className="text-lg font-semibold text-muted">
              / {settings.dailyGoal}
            </span>
          </p>
          <ProgressBar
            className="mt-3"
            value={goalPct}
            tone={goalDone ? "ok" : "primary"}
          />
          <p className="mt-2 text-xs text-muted">
            {goalDone
              ? "Meta batida! Cada dia desses conta muito. 💛"
              : `Faltam ${Math.max(0, settings.dailyGoal - stats.todayCount)} questões pra fechar o dia.`}
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-faint">
            Sequência
          </p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tabular-nums text-text">
              {hydrated ? stats.streak : 0}
            </span>
            <span className="text-lg font-semibold text-muted">
              {stats.streak === 1 ? "dia" : "dias"} 🔥
            </span>
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-primary">{hydrated ? stats.accuracy : 0}%</p>
              <p className="text-[11px] text-faint">acerto</p>
            </div>
            <div>
              <p className="text-lg font-bold text-text">{hydrated ? stats.totalAttempts : 0}</p>
              <p className="text-[11px] text-faint">questões</p>
            </div>
            <div>
              <p className="text-lg font-bold text-text">{hydrated ? stats.activeDays : 0}</p>
              <p className="text-[11px] text-faint">dias ativos</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Grid de recursos */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-xl transition-transform group-hover:scale-110">
              {f.icon}
            </div>
            <h2 className="font-bold text-text group-hover:text-primary">
              {f.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{f.desc}</p>
          </Link>
        ))}
      </section>

      {hydrated && stats.totalQuestions === 0 ? (
        <Card className="border-dashed p-6 text-center">
          <p className="font-semibold text-text">Seu banco de questões está vazio.</p>
          <p className="mt-1 text-sm text-muted">
            Cadastre questões manualmente ou importe um PDF de prova — a IA organiza tudo.
          </p>
          <ButtonLink href="/admin/nova-questao" variant="secondary" className="mt-4">
            Adicionar questões
          </ButtonLink>
        </Card>
      ) : null}
    </div>
  );
}
