"use client";

import { useMemo } from "react";
import { useAppData, useSettings } from "@/lib/store";
import { dateKey, daysUntil, usePriorities, useReviewQueue } from "@/lib/stats";
import { nextEnemDate } from "@/components/Countdown";
import { resumoFor } from "@/lib/resumos";
import type { Priority } from "@/lib/stats";

export interface PlanTask {
  id: string;
  kind: "revisao" | "questoes" | "redacao" | "resumo";
  title: string;
  detail: string;
  href: string;
  target: number;
  done: number;
}

export interface DayPlan {
  tasks: PlanTask[];
  answeredToday: number;
  goalQuestions: number;
  week: { key: string; label: string; studied: boolean; isToday: boolean }[];
  daysStudiedThisWeek: number;
  daysToEnem: number | null;
  allDone: boolean;
}

const DAY_MS = 86_400_000;

function splitGoal(goal: number, parts: number): number[] {
  const base = Math.floor(goal / parts);
  const rest = goal - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < rest ? 1 : 0));
}

export function useDayPlan(): DayPlan {
  const { attempts, redacoes, questions } = useAppData();
  const [settings] = useSettings();
  const priorities = usePriorities();
  const reviewQueue = useReviewQueue();

  return useMemo(() => {
    const todayKey = dateKey(new Date());
    const dayIdx = Math.floor(new Date().getTime() / DAY_MS);
    const goal = Math.max(5, settings.dailyGoal || 15);

    const answeredToday = attempts.filter((a) => dateKey(a.createdAt) === todayKey).length;
    const redacoesToday = redacoes.filter(
      (r) => dateKey(r.createdAt) === todayKey,
    ).length;
    const dueReview = reviewQueue.filter((i) => i.status === "due").length;

    const trainable = new Set(questions.map((q) => q.topic).filter(Boolean));
    const topPriorities: Priority[] = priorities.filter(
      (p) => trainable.has(p.topic) && p.score > 0,
    );

    const tasks: PlanTask[] = [];

    // 1. Revisão de erros (se houver algo pra hoje)
    if (dueReview > 0) {
      const n = Math.min(dueReview, Math.max(3, Math.round(goal * 0.4)));
      tasks.push({
        id: "revisao",
        kind: "revisao",
        title: `Revisar ${n} ${n === 1 ? "erro" : "erros"}`,
        detail: "Questões que você errou e já é hora de rever.",
        href: "/simulado?source=erradas&auto=1",
        target: n,
        done: Math.min(n, answeredToday),
      });
    }

    // 2. Questões novas nos assuntos que mais rendem ponto
    const questionGoal = Math.max(5, goal - (dueReview > 0 ? Math.round(goal * 0.3) : 0));
    const picks =
      topPriorities.length > 0
        ? Array.from({ length: Math.min(2, topPriorities.length) }, (_, i) => {
            const pool = topPriorities.slice(0, Math.max(4, Math.ceil(topPriorities.length * 0.5)));
            return pool[(dayIdx + i) % pool.length];
          })
        : [];

    if (picks.length > 0) {
      const parts = splitGoal(questionGoal, picks.length);
      picks.forEach((p, i) => {
        tasks.push({
          id: `q-${p.topic}`,
          kind: "questoes",
          title: `${parts[i]} questões de ${p.topic}`,
          detail: p.reason,
          href: `/simulado?topic=${encodeURIComponent(p.topic)}&area=${encodeURIComponent(p.subject)}&auto=1`,
          target: parts[i],
          done: 0, // preenchido abaixo pelo total do dia
        });
      });
    } else {
      tasks.push({
        id: "q-geral",
        kind: "questoes",
        title: `${questionGoal} questões`,
        detail: "Simulado misto de todas as áreas.",
        href: "/simulado?auto=1",
        target: questionGoal,
        done: 0,
      });
    }

    // distribui as questões respondidas hoje entre as tasks de questões
    let remaining = answeredToday - (dueReview > 0 ? Math.min(dueReview, answeredToday) : 0);
    for (const t of tasks) {
      if (t.kind !== "questoes") continue;
      t.done = Math.max(0, Math.min(t.target, remaining));
      remaining -= t.done;
    }

    // 3. Redação (a cada 3 dias)
    if (dayIdx % 3 === 0) {
      tasks.push({
        id: "redacao",
        kind: "redacao",
        title: "Escrever 1 redação",
        detail: "Tema de um treino ou um provável. Peça a correção da IA no fim.",
        href: "/redacao",
        target: 1,
        done: Math.min(1, redacoesToday),
      });
    }

    // 4. Resumo do assunto mais fraco (se existir)
    const weakWithResumo = topPriorities.find((p) => resumoFor(p.topic));
    if (weakWithResumo) {
      tasks.push({
        id: "resumo",
        kind: "resumo",
        title: `Ler o resumo de ${weakWithResumo.topic}`,
        detail: "Revisão rápida de 1 tela antes de treinar o assunto.",
        href: `/resumos?t=${encodeURIComponent(weakWithResumo.topic)}`,
        target: 1,
        done: 0,
      });
    }

    // semana (últimos 7 dias) — sem lógica de "streak que quebra"
    const studiedDays = new Set(attempts.map((a) => dateKey(a.createdAt)));
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(new Date().getTime() - (6 - i) * DAY_MS);
      const key = dateKey(d);
      return {
        key,
        label: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        studied: studiedDays.has(key),
        isToday: key === todayKey,
      };
    });

    const enem = nextEnemDate(settings.enemDates);

    return {
      tasks,
      answeredToday,
      goalQuestions: goal,
      week,
      daysStudiedThisWeek: week.filter((d) => d.studied).length,
      daysToEnem: enem ? Math.max(0, daysUntil(enem.date)) : null,
      allDone: tasks.every((t) => t.done >= t.target),
    };
  }, [attempts, redacoes, questions, settings, priorities, reviewQueue]);
}
