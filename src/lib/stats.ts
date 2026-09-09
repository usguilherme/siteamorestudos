"use client";

import { useMemo } from "react";
import { ENEM_AREAS } from "@/lib/enem";
import { useAppData } from "@/lib/store";
import type { Attempt, Question } from "@/types";

export function dateKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("sv-SE"); // yyyy-mm-dd, estável
}

export function daysUntil(iso: string): number {
  const target = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export function accuracyOf(attempts: Attempt[]): number {
  if (!attempts.length) return 0;
  return Math.round(
    (attempts.filter((a) => a.isCorrect).length / attempts.length) * 100,
  );
}

/** Sequência de dias consecutivos com pelo menos uma questão respondida. */
export function computeStreak(attempts: Attempt[]): number {
  if (!attempts.length) return 0;
  const days = new Set(attempts.map((a) => dateKey(a.createdAt)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // se ainda não estudou hoje, a sequência pode terminar ontem
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface AreaStat {
  name: string;
  short: string;
  emoji: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface TopicStat {
  topic: string;
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface Stats {
  totalAttempts: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  uniqueAnswered: number;
  totalQuestions: number;
  coverage: number;
  streak: number;
  todayCount: number;
  activeDays: number;
  avgTime: number; // segundos por questão (média das tentativas com tempo)
  byArea: AreaStat[];
  byTopic: TopicStat[]; // pior → melhor
  byReason: { reason: string; count: number }[];
  timeline: { date: string; label: string; accuracy: number; total: number }[];
}

export function computeStats(questions: Question[], attempts: Attempt[]): Stats {
  const correct = attempts.filter((a) => a.isCorrect).length;
  const total = attempts.length;
  const uniqueAnswered = new Set(attempts.map((a) => a.questionId).filter(Boolean)).size;

  const byArea: AreaStat[] = ENEM_AREAS.map((area) => {
    const list = attempts.filter((a) => a.subject === area.name);
    const c = list.filter((a) => a.isCorrect).length;
    return {
      name: area.name,
      short: area.short,
      emoji: area.emoji,
      total: list.length,
      correct: c,
      accuracy: accuracyOf(list),
    };
  });

  const topicMap = new Map<string, TopicStat>();
  for (const a of attempts) {
    if (!a.topic) continue;
    const key = a.topic;
    const cur =
      topicMap.get(key) ??
      { topic: a.topic, subject: a.subject, total: 0, correct: 0, accuracy: 0 };
    cur.total++;
    if (a.isCorrect) cur.correct++;
    topicMap.set(key, cur);
  }
  const byTopic = [...topicMap.values()]
    .map((t) => ({ ...t, accuracy: Math.round((t.correct / t.total) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);

  const reasonMap = new Map<string, number>();
  for (const a of attempts) {
    if (a.isCorrect || !a.reason) continue;
    reasonMap.set(a.reason, (reasonMap.get(a.reason) ?? 0) + 1);
  }
  const byReason = [...reasonMap.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  // Timeline dos últimos 14 dias com atividade
  const dayMap = new Map<string, { total: number; correct: number }>();
  for (const a of attempts) {
    const k = dateKey(a.createdAt);
    const cur = dayMap.get(k) ?? { total: 0, correct: 0 };
    cur.total++;
    if (a.isCorrect) cur.correct++;
    dayMap.set(k, cur);
  }
  const timeline = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, v]) => ({
      date,
      label: new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      accuracy: Math.round((v.correct / v.total) * 100),
      total: v.total,
    }));

  const timed = attempts.filter((a) => a.timeSpent > 0);
  const avgTime = timed.length
    ? Math.round(timed.reduce((s, a) => s + a.timeSpent, 0) / timed.length)
    : 0;

  const todayKey = dateKey(new Date());

  return {
    totalAttempts: total,
    correct,
    incorrect: total - correct,
    accuracy: accuracyOf(attempts),
    uniqueAnswered,
    totalQuestions: questions.length,
    coverage: questions.length
      ? Math.round((uniqueAnswered / questions.length) * 100)
      : 0,
    streak: computeStreak(attempts),
    todayCount: attempts.filter((a) => dateKey(a.createdAt) === todayKey).length,
    activeDays: dayMap.size,
    avgTime,
    byArea,
    byTopic,
    byReason,
    timeline,
  };
}

export function useStats(): Stats {
  const { questions, attempts } = useAppData();
  return useMemo(() => computeStats(questions, attempts), [questions, attempts]);
}

/* ------------------------------------------------------------------ */
/* Fila de revisão (repetição espaçada simples)                        */
/* ------------------------------------------------------------------ */

const REVIEW_INTERVALS_DAYS = [1, 3, 7, 15, 30];

export interface ReviewItem {
  question: Question;
  lastErrorAt: string;
  errorCount: number;
  lastReason?: string | null;
  reviewedAt?: string;
  status: "due" | "scheduled" | "recovered";
  dueInDays: number;
}

export function computeReviewQueue(
  questions: Question[],
  attempts: Attempt[],
  reviewedAt: Record<string, string>,
): ReviewItem[] {
  const byQuestion = new Map<string, Attempt[]>();
  for (const a of attempts) {
    if (!a.questionId) continue;
    const arr = byQuestion.get(a.questionId) ?? [];
    arr.push(a);
    byQuestion.set(a.questionId, arr);
  }

  const items: ReviewItem[] = [];
  for (const [qid, list] of byQuestion) {
    const question = questions.find((q) => q.id === qid);
    if (!question) continue;
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = list[list.length - 1];
    const errors = list.filter((a) => !a.isCorrect);
    if (!errors.length) continue;

    const lastErrorAt = errors[errors.length - 1].createdAt;
    const reviewed = reviewedAt[qid];

    // Última tentativa foi certa → questão recuperada, sai da fila ativa.
    if (last.isCorrect) {
      items.push({
        question,
        lastErrorAt,
        errorCount: errors.length,
        lastReason: errors[errors.length - 1].reason,
        reviewedAt: reviewed,
        status: "recovered",
        dueInDays: 0,
      });
      continue;
    }

    const anchor = reviewed && reviewed > lastErrorAt ? reviewed : lastErrorAt;
    const idx = Math.min(errors.length - 1, REVIEW_INTERVALS_DAYS.length - 1);
    const intervalMs = REVIEW_INTERVALS_DAYS[idx] * 86_400_000;
    const due = new Date(anchor).getTime() + intervalMs;
    const dueInDays = Math.ceil((due - Date.now()) / 86_400_000);

    items.push({
      question,
      lastErrorAt,
      errorCount: errors.length,
      lastReason: errors[errors.length - 1].reason,
      reviewedAt: reviewed,
      status: dueInDays <= 0 ? "due" : "scheduled",
      dueInDays: Math.max(0, dueInDays),
    });
  }

  const rank = { due: 0, scheduled: 1, recovered: 2 };
  return items.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      b.errorCount - a.errorCount ||
      a.lastErrorAt.localeCompare(b.lastErrorAt),
  );
}

export function useReviewQueue(): ReviewItem[] {
  const { questions, attempts, reviewedAt } = useAppData();
  return useMemo(
    () => computeReviewQueue(questions, attempts, reviewedAt),
    [questions, attempts, reviewedAt],
  );
}
