"use client";

// Camada de dados única do app.
//
// - Fonte da verdade: um único objeto `AppData` em memória.
// - Persistência local: localStorage (sempre, funciona offline).
// - Persistência remota: Realtime Database (opcional — só se configurado).
//   Estratégia simples para um único usuário: espelha o blob inteiro em
//   `valessa/data` com `updatedAt`; na chegada de um estado remoto mais novo,
//   substitui o local. Last-write-wins no documento inteiro.

import { useMemo, useSyncExternalStore } from "react";
import { onValue, ref, set as rtdbSet } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { DEFAULT_ENEM_DATES } from "@/lib/enem";
import type {
  AppData,
  Attempt,
  Question,
  Session,
  Settings,
} from "@/types";

const LS_KEY = "ea:v2:data";
const LS_TS_KEY = "ea:v2:ts";
const RTDB_PATH = "valessa/data";
const DATA_VERSION = 2;

export function genId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* noop */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_SETTINGS: Settings = {
  name: "",
  dailyGoal: 15,
  enemDates: DEFAULT_ENEM_DATES,
  theme: "system",
  onboarded: false,
};

function defaultData(): AppData {
  return {
    version: DATA_VERSION,
    questions: [],
    attempts: [],
    sessions: [],
    favorites: [],
    reviewedAt: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

// Snapshot estável para SSR / primeira renderização (antes da hidratação).
const SERVER_SNAPSHOT = defaultData();

let data: AppData | null = null;
let hydrated = false;
let updatedAt = 0;
let applyingRemote = false;

const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l();
}

/* ------------------------------------------------------------------ */
/* Migração dos dados antigos (chaves estudos_amor_*)                  */
/* ------------------------------------------------------------------ */

type Rec = Record<string, unknown>;
const asStr = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const asObj = (v: unknown): Rec =>
  v && typeof v === "object" ? (v as Rec) : {};

function readLegacy(key: string): Rec[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(asObj) : [];
  } catch {
    return [];
  }
}

function migrateLegacy(): AppData | null {
  const legacyQuestions = readLegacy("estudos_amor_questions");
  const legacyHistory = readLegacy("estudos_amor_history");
  const legacyFavorites = readLegacy("estudos_amor_favorites");

  if (!legacyQuestions.length && !legacyHistory.length && !legacyFavorites.length) {
    return null;
  }

  const base = defaultData();
  const byStatement = new Map<string, string>();

  base.questions = legacyQuestions.map((q) => {
    const id = asStr(q.id) || genId();
    const statement = asStr(q.statement);
    if (statement) byStatement.set(statement, id);
    return {
      id,
      subject: asStr(q.subject),
      topic: asStr(q.topic),
      statement,
      options: Array.isArray(q.options)
        ? (q.options as Question["options"])
        : [],
      correctOption: asStr(q.correctOption),
      explanation: asStr(q.explanation) || undefined,
      source: asStr(q.source) || undefined,
      createdAt: asStr(q.createdAt) || new Date().toISOString(),
    } satisfies Question;
  });

  base.attempts = legacyHistory.map((h) => ({
    id: genId(),
    questionId: byStatement.get(asStr(h.statement)) ?? "",
    statement: asStr(h.statement),
    subject: asStr(h.subject),
    topic: asStr(h.topic),
    isCorrect: !!h.isCorrect,
    userAnswer: asStr(h.selected),
    correctAnswer: asStr(h.correct),
    reason: (asStr(h.errorReason) || null) as Attempt["reason"],
    timeSpent: 0,
    mode: "treino" as const,
    createdAt: asStr(h.date) || new Date().toISOString(),
  } satisfies Attempt));

  base.favorites = Array.from(
    new Set(
      legacyFavorites
        .map((f) => byStatement.get(asStr(f.statement)))
        .filter((id): id is string => typeof id === "string"),
    ),
  );

  return base;
}

/* ------------------------------------------------------------------ */
/* Hidratação e persistência                                           */
/* ------------------------------------------------------------------ */

function normQuestion(v: unknown): Question {
  const q = asObj(v);
  return {
    id: asStr(q.id) || genId(),
    subject: asStr(q.subject),
    topic: asStr(q.topic),
    statement: asStr(q.statement),
    options: Array.isArray(q.options) ? (q.options as Question["options"]) : [],
    correctOption: asStr(q.correctOption),
    explanation: asStr(q.explanation) || undefined,
    imageUrl: asStr(q.imageUrl) || undefined,
    possiblyHasImage: !!q.possiblyHasImage,
    source: asStr(q.source) || undefined,
    createdAt: asStr(q.createdAt) || new Date().toISOString(),
  };
}

function normAttempt(v: unknown): Attempt {
  const a = asObj(v);
  return {
    id: asStr(a.id) || genId(),
    questionId: asStr(a.questionId),
    statement: asStr(a.statement),
    subject: asStr(a.subject),
    topic: asStr(a.topic),
    isCorrect: !!a.isCorrect,
    userAnswer: asStr(a.userAnswer ?? a.selected),
    correctAnswer: asStr(a.correctAnswer ?? a.correct),
    reason: (asStr(a.reason ?? a.errorReason) || null) as Attempt["reason"],
    timeSpent: typeof a.timeSpent === "number" ? a.timeSpent : 0,
    mode: a.mode === "prova" ? "prova" : "treino",
    createdAt: asStr(a.createdAt ?? a.date) || new Date().toISOString(),
  };
}

function coerce(input: unknown): AppData {
  const parsed = asObj(input);
  const base = defaultData();
  return {
    version: DATA_VERSION,
    questions: Array.isArray(parsed.questions)
      ? parsed.questions.map(normQuestion)
      : base.questions,
    attempts: Array.isArray(parsed.attempts)
      ? parsed.attempts.map(normAttempt)
      : base.attempts,
    sessions: Array.isArray(parsed.sessions)
      ? (parsed.sessions as Session[])
      : base.sessions,
    favorites: Array.isArray(parsed.favorites)
      ? parsed.favorites.filter((f): f is string => typeof f === "string")
      : base.favorites,
    reviewedAt:
      parsed.reviewedAt && typeof parsed.reviewedAt === "object"
        ? (parsed.reviewedAt as Record<string, string>)
        : base.reviewedAt,
    settings: { ...base.settings, ...(asObj(parsed.settings) as Partial<Settings>) },
  };
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      data = coerce(JSON.parse(raw));
      updatedAt = Number(localStorage.getItem(LS_TS_KEY)) || 1;
    } else {
      const migrated = migrateLegacy();
      data = migrated ?? defaultData();
      // dados migrados são "reais" e devem vencer a nuvem vazia;
      // um começo do zero (updatedAt=0) deixa a nuvem preencher.
      updatedAt = migrated ? Date.now() : 0;
      writeLocal();
    }
  } catch {
    data = defaultData();
    updatedAt = 0;
  }

  attachRemote();
  emit();
}

function writeLocal() {
  if (!data || typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    localStorage.setItem(LS_TS_KEY, String(updatedAt));
  } catch (e) {
    console.warn("[store] falha ao gravar localStorage:", e);
  }
}

function pushRemote() {
  if (!rtdb || !data) return;
  try {
    rtdbSet(ref(rtdb, RTDB_PATH), { ...data, updatedAt }).catch((e) => {
      console.warn("[store] sync remoto falhou:", e);
    });
  } catch (e) {
    console.warn("[store] sync remoto falhou:", e);
  }
}

function schedulePersist() {
  writeLocal();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(pushRemote, 600);
}

function attachRemote() {
  if (!rtdb) return;
  onValue(ref(rtdb, RTDB_PATH), (snap) => {
    const remote = snap.val();
    if (!remote || typeof remote !== "object") return;
    const remoteUpdatedAt = Number(remote.updatedAt ?? 0);
    if (remoteUpdatedAt <= updatedAt) return; // local está igual ou mais novo
    applyingRemote = true;
    data = coerce(remote);
    updatedAt = remoteUpdatedAt;
    writeLocal();
    applyingRemote = false;
    emit();
  });
}

/* ------------------------------------------------------------------ */
/* Mutações                                                            */
/* ------------------------------------------------------------------ */

function mutate(fn: (d: AppData) => void) {
  if (typeof window === "undefined") return;
  if (!hydrated) hydrate();
  if (!data) data = defaultData();
  fn(data);
  if (!applyingRemote) {
    updatedAt = Date.now();
    schedulePersist();
  }
  emit();
}

export function addQuestion(
  q: Omit<Question, "id" | "createdAt"> & { id?: string; createdAt?: string },
): string {
  const id = q.id ?? genId();
  mutate((d) => {
    d.questions.push({
      ...q,
      id,
      createdAt: q.createdAt ?? new Date().toISOString(),
    });
  });
  return id;
}

export function addQuestions(
  list: Array<Omit<Question, "id" | "createdAt"> & { id?: string }>,
): string[] {
  const ids: string[] = [];
  mutate((d) => {
    for (const q of list) {
      const id = q.id ?? genId();
      ids.push(id);
      d.questions.push({ ...q, id, createdAt: new Date().toISOString() });
    }
  });
  return ids;
}

export function updateQuestion(id: string, patch: Partial<Question>) {
  mutate((d) => {
    const i = d.questions.findIndex((q) => q.id === id);
    if (i >= 0) d.questions[i] = { ...d.questions[i], ...patch, id };
  });
}

export function deleteQuestion(id: string) {
  mutate((d) => {
    d.questions = d.questions.filter((q) => q.id !== id);
    d.favorites = d.favorites.filter((f) => f !== id);
  });
}

export function recordAttempt(a: Omit<Attempt, "id" | "createdAt">): string {
  const id = genId();
  mutate((d) => {
    d.attempts.push({ ...a, id, createdAt: new Date().toISOString() });
  });
  return id;
}

export function updateAttempt(id: string, patch: Partial<Attempt>) {
  mutate((d) => {
    const i = d.attempts.findIndex((a) => a.id === id);
    if (i >= 0) d.attempts[i] = { ...d.attempts[i], ...patch, id };
  });
}

export function deleteAttempt(id: string) {
  mutate((d) => {
    d.attempts = d.attempts.filter((a) => a.id !== id);
  });
}

export function clearAttempts() {
  mutate((d) => {
    d.attempts = [];
    d.sessions = [];
    d.reviewedAt = {};
  });
}

export function saveSession(s: Omit<Session, "id" | "createdAt">): string {
  const id = genId();
  mutate((d) => {
    d.sessions.push({ ...s, id, createdAt: new Date().toISOString() });
  });
  return id;
}

export function toggleFavorite(questionId: string) {
  mutate((d) => {
    d.favorites = d.favorites.includes(questionId)
      ? d.favorites.filter((f) => f !== questionId)
      : [...d.favorites, questionId];
  });
}

export function markReviewed(questionId: string) {
  mutate((d) => {
    d.reviewedAt[questionId] = new Date().toISOString();
  });
}

export function updateSettings(patch: Partial<Settings>) {
  mutate((d) => {
    d.settings = { ...d.settings, ...patch };
  });
}

export function exportData(): AppData {
  if (!hydrated) hydrate();
  return data ?? defaultData();
}

export function importData(incoming: unknown, mode: "merge" | "replace" = "merge") {
  const raw = asObj(incoming);
  // aceita também backups antigos no formato {questions, history, favorites}
  const parsed = coerce(
    raw.questions || raw.attempts || raw.settings
      ? raw
      : { questions: raw.questions, attempts: raw.history, favorites: raw.favorites },
  );
  mutate((d) => {
    if (mode === "replace") {
      d.questions = parsed.questions;
      d.attempts = parsed.attempts;
      d.sessions = parsed.sessions;
      d.favorites = parsed.favorites;
      d.reviewedAt = parsed.reviewedAt;
      d.settings = parsed.settings;
      return;
    }
    const qIds = new Set(d.questions.map((q) => q.id));
    for (const q of parsed.questions) if (!qIds.has(q.id)) d.questions.push(q);
    const aIds = new Set(d.attempts.map((a) => a.id));
    for (const a of parsed.attempts) if (!aIds.has(a.id)) d.attempts.push(a);
    const sIds = new Set(d.sessions.map((s) => s.id));
    for (const s of parsed.sessions) if (!sIds.has(s.id)) d.sessions.push(s);
    d.favorites = Array.from(new Set([...d.favorites, ...parsed.favorites]));
    d.reviewedAt = { ...d.reviewedAt, ...parsed.reviewedAt };
  });
}

export function resetData() {
  mutate((d) => {
    const keepName = d.settings.name;
    Object.assign(d, defaultData());
    d.settings.name = keepName;
    d.settings.onboarded = true;
  });
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!hydrated) queueMicrotask(hydrate);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AppData {
  return data ?? SERVER_SNAPSHOT;
}

function getServerSnapshot(): AppData {
  return SERVER_SNAPSHOT;
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** true depois que o localStorage foi lido (evita flash de "vazio"). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated && data !== null,
    () => false,
  );
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const d = useAppData();
  return [d.settings, updateSettings];
}

export function useFavorites(): [Set<string>, (id: string) => void] {
  const d = useAppData();
  const set = useMemo(() => new Set(d.favorites), [d.favorites]);
  return [set, toggleFavorite];
}

export function useQuestions(): Question[] {
  return useAppData().questions;
}

export function useAttempts(): Attempt[] {
  return useAppData().attempts;
}
