"use client";

import { useMemo } from "react";
import { ALL_TOPICS, ENEM_AREAS, incidenceOf } from "@/lib/enem";
import { useAppData } from "@/lib/store";
import type { Attempt, Difficulty, Question } from "@/types";

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

/* ------------------------------------------------------------------ */
/* Nota estimada (heurística inspirada na TRI — NÃO é a TRI oficial)   */
/* ------------------------------------------------------------------ */

const DIFF_WEIGHT: Record<Difficulty, number> = {
  facil: 0.6,
  media: 1,
  dificil: 1.6,
};

export interface ScoreEstimate {
  overall: number | null;
  byArea: { name: string; short: string; score: number | null; count: number }[];
  note: string;
}

function areaScore(attempts: Attempt[]): number | null {
  if (!attempts.length) return null;
  let num = 0;
  let den = 0;
  for (const a of attempts) {
    const w = DIFF_WEIGHT[a.difficulty ?? "media"];
    den += w;
    if (a.isCorrect) num += w;
  }
  const wacc = den ? num / den : 0;
  let score = 300 + wacc * 700; // faixa aproximada da TRI: ~300 (chão) a 1000

  // Incoerência (acertar difícil e errar fácil) puxa a nota pra baixo,
  // como a TRI faz ao desconfiar de acertos "sorte/chute".
  const easyWrong = attempts.filter((a) => a.difficulty === "facil" && !a.isCorrect).length;
  const hardRight = attempts.filter((a) => a.difficulty === "dificil" && a.isCorrect).length;
  if (easyWrong > 0 && hardRight > 0) {
    score -= Math.min(140, 45 * Math.min(easyWrong, hardRight));
  }
  return Math.round(Math.max(0, Math.min(1000, score)));
}

export function computeScoreEstimate(attempts: Attempt[]): ScoreEstimate {
  const byArea = ENEM_AREAS.map((area) => {
    const list = attempts.filter((a) => a.subject === area.name);
    return {
      name: area.name,
      short: area.short,
      score: areaScore(list),
      count: list.length,
    };
  });
  const withData = byArea.filter((a) => a.score !== null && a.count >= 5);
  const overall = withData.length
    ? Math.round(withData.reduce((s, a) => s + (a.score ?? 0), 0) / withData.length)
    : null;

  const note =
    attempts.length < 20
      ? "Estimativa grosseira — responda mais questões (com dificuldade marcada) pra ela ficar confiável."
      : "Estimativa heurística ponderada por dificuldade. A nota real do ENEM usa a TRI oficial e pode variar.";

  return { overall, byArea, note };
}

export function useScoreEstimate(): ScoreEstimate {
  const { attempts } = useAppData();
  return useMemo(() => computeScoreEstimate(attempts), [attempts]);
}

/* ------------------------------------------------------------------ */
/* Priorização por custo-benefício (incidência x desempenho dela)      */
/* ------------------------------------------------------------------ */

export interface Priority {
  topic: string;
  subject: string;
  incidence: number;
  attempts: number;
  accuracy: number | null; // null = nunca praticou
  score: number; // quanto maior, mais vale priorizar
  reason: string;
}

export function computePriorities(attempts: Attempt[]): Priority[] {
  const byTopic = new Map<string, { total: number; correct: number; subject: string }>();
  for (const a of attempts) {
    if (!a.topic) continue;
    const cur = byTopic.get(a.topic) ?? { total: 0, correct: 0, subject: a.subject };
    cur.total++;
    if (a.isCorrect) cur.correct++;
    byTopic.set(a.topic, cur);
  }

  const out: Priority[] = ALL_TOPICS.map((topic) => {
    const area = ENEM_AREAS.find((ar) => ar.topics.includes(topic));
    const data = byTopic.get(topic);
    const incidence = incidenceOf(topic);
    const acc = data && data.total >= 3 ? data.correct / data.total : null;

    // gap: o quanto ela ainda tem a ganhar nesse assunto (0..1)
    const gap = acc === null ? 0.8 : 1 - acc;
    const score = incidence * gap;

    let reason: string;
    if (acc === null) reason = "cai muito e você quase não treinou";
    else if (acc < 0.5) reason = "cai muito e seu acerto está baixo";
    else if (acc < 0.7) reason = "cai bastante e dá pra melhorar";
    else reason = "você já vai bem aqui";

    return {
      topic,
      subject: area?.name ?? "",
      incidence,
      attempts: data?.total ?? 0,
      accuracy: acc === null ? null : Math.round(acc * 100),
      score: Math.round(score * 10) / 10,
      reason,
    };
  });

  return out.sort((a, b) => b.score - a.score);
}

export function usePriorities(): Priority[] {
  const { attempts } = useAppData();
  return useMemo(() => computePriorities(attempts), [attempts]);
}

/* ------------------------------------------------------------------ */
/* Camada de progresso: XP e nível.                                    */
/*                                                                    */
/* Função PURA derivada de `attempts` — nunca um campo persistido,     */
/* nunca cálculo dentro de componente. Assim continua consistente      */
/* mesmo se ela estudar em outro dispositivo e os blocos              */
/* sincronizarem fora de ordem: o histórico é a fonte da verdade.      */
/* Frequência (dias estudados na semana) NUNCA pune — ver plano.ts.    */
/* ------------------------------------------------------------------ */

const XP_PER_ANSWER = 6; // por questão respondida
const XP_CORRECT_BONUS = 10; // bônus de acerto
const XP_HARD_BONUS = 6; // bônus por questão marcada como difícil

// limiares crescentes; o índice i corresponde ao nível i+1
const LEVEL_THRESHOLDS = [
  0, 120, 320, 640, 1100, 1750, 2600, 3700, 5100, 6800, 8900, 11500,
];
// nomes discretos, sem pressão
const LEVEL_NAMES = [
  "Começando",
  "Aquecendo",
  "Pegando o ritmo",
  "Constante",
  "Afiada",
  "Focada",
  "No embalo",
  "Imparável",
  "Fera do ENEM",
  "Nível aprovação",
  "Modo TRI",
  "Lenda",
];

export interface Progress {
  xp: number;
  level: number; // 1-based
  levelName: string;
  nextLevelName: string | null;
  xpIntoLevel: number; // XP acumulado dentro do nível atual
  xpForLevel: number; // tamanho do nível atual (0 no último)
  xpToNext: number; // quanto falta pro próximo (0 no último)
  pct: number; // 0..100 dentro do nível atual
}

export function xpForAttempt(a: Attempt): number {
  let xp = XP_PER_ANSWER;
  if (a.isCorrect) xp += XP_CORRECT_BONUS;
  if (a.difficulty === "dificil") xp += XP_HARD_BONUS;
  return xp;
}

export function computeProgress(attempts: Attempt[]): Progress {
  const xp = attempts.reduce((s, a) => s + xpForAttempt(a), 0);

  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const isLast = level >= LEVEL_THRESHOLDS.length;
  const base = LEVEL_THRESHOLDS[level - 1];
  const next = isLast ? base : LEVEL_THRESHOLDS[level];
  const xpForLevel = isLast ? 0 : next - base;
  const xpIntoLevel = xp - base;
  const xpToNext = isLast ? 0 : next - xp;
  const pct = isLast || xpForLevel === 0
    ? 100
    : Math.max(0, Math.min(100, Math.round((xpIntoLevel / xpForLevel) * 100)));

  return {
    xp,
    level,
    levelName: LEVEL_NAMES[level - 1] ?? LEVEL_NAMES[LEVEL_NAMES.length - 1],
    nextLevelName: isLast ? null : LEVEL_NAMES[level] ?? null,
    xpIntoLevel,
    xpForLevel,
    xpToNext,
    pct,
  };
}

export function useProgress(): Progress {
  const { attempts } = useAppData();
  return useMemo(() => computeProgress(attempts), [attempts]);
}

/* ------------------------------------------------------------------ */
/* Janela de 7 dias — base dos KPIs da Home e do "vs. sua média".      */
/* Tudo com estado vazio honesto: sem dado → null, nunca número falso. */
/* ------------------------------------------------------------------ */

export interface WeeklyWindow {
  answered: number; // tentativas nos últimos 7 dias
  correct: number;
  accuracy: number | null; // null se answered === 0
  studySeconds: number; // soma de timeSpent na janela
  daysStudied: number; // dias distintos com atividade na janela
  prevAvgAccuracy: number | null; // acerto médio das ~4 semanas anteriores
  accuracyDelta: number | null; // accuracy - prevAvgAccuracy (pontos %)
  bars: { key: string; letter: string; count: number; isToday: boolean }[];
  avgPerDay: number; // média de questões/dia na janela (linha tracejada)
}

export function computeWeeklyWindow(attempts: Attempt[]): WeeklyWindow {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const dayMs = 86_400_000;
  const todayK = dateKey(now);

  const bars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfToday.getTime() - (6 - i) * dayMs);
    const key = dateKey(d);
    return {
      key,
      letter: d
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .charAt(0)
        .toUpperCase(),
      count: 0,
      isToday: key === todayK,
    };
  });
  const barIndex = new Map(bars.map((b, i) => [b.key, i] as const));

  const windowStart = startOfToday.getTime() - 6 * dayMs;
  let answered = 0;
  let correct = 0;
  let studySeconds = 0;
  const daysSet = new Set<string>();

  const prevStart = startOfToday.getTime() - 34 * dayMs;
  let pTotal = 0;
  let pCorrect = 0;

  for (const a of attempts) {
    const t = new Date(a.createdAt).getTime();
    if (t >= windowStart) {
      answered++;
      if (a.isCorrect) correct++;
      studySeconds += a.timeSpent || 0;
      const k = dateKey(a.createdAt);
      daysSet.add(k);
      const idx = barIndex.get(k);
      if (idx !== undefined) bars[idx].count++;
    } else if (t >= prevStart) {
      pTotal++;
      if (a.isCorrect) pCorrect++;
    }
  }

  const accuracy = answered ? Math.round((correct / answered) * 100) : null;
  const prevAvgAccuracy = pTotal ? Math.round((pCorrect / pTotal) * 100) : null;
  const accuracyDelta =
    accuracy !== null && prevAvgAccuracy !== null
      ? accuracy - prevAvgAccuracy
      : null;

  return {
    answered,
    correct,
    accuracy,
    studySeconds,
    daysStudied: daysSet.size,
    prevAvgAccuracy,
    accuracyDelta,
    bars,
    avgPerDay: answered ? Math.round((answered / 7) * 10) / 10 : 0,
  };
}

export function useWeeklyWindow(): WeeklyWindow {
  const { attempts } = useAppData();
  return useMemo(() => computeWeeklyWindow(attempts), [attempts]);
}
