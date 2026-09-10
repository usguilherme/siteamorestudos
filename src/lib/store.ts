"use client";

// Camada de dados única do app.
//
// - Fonte da verdade: um objeto `AppData` em memória.
// - Persistência local: localStorage (sempre, funciona offline).
// - Persistência remota: Realtime Database (opcional — só se configurado).
//
// O banco de questões é grande e muda pouco; os dados da aluna (tentativas,
// redações, ajustes) são pequenos e mudam a cada questão respondida. Por isso
// ficam em nós/chaves SEPARADOS — assim responder uma questão não reescreve
// 3 MB de questões toda hora.
//   valessa/questions  ->  { list: Question[], updatedAt }
//   valessa/user       ->  { ...resto do AppData, updatedAt }

import { useMemo, useSyncExternalStore } from "react";
import { onValue, ref, set as rtdbSet } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { DEFAULT_ENEM_DATES } from "@/lib/enem";
import type {
  AppData,
  Attempt,
  Difficulty,
  Question,
  Redacao,
  Session,
  Settings,
} from "@/types";

const LEGACY_KEY = "ea:v2:data"; // versão antiga combinada
const USER_KEY = "ea:v2:user";
const USER_TS = "ea:v2:user_ts";
const Q_KEY = "ea:v2:questions";
const Q_TS = "ea:v2:questions_ts";
const RTDB_USER = "valessa/user";
const RTDB_Q = "valessa/questions";
const DATA_VERSION = 3;

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
  theme: "dark",
  onboarded: false,
  sidebarCollapsed: false,
  openedCorrecoes: [],
};

function defaultData(): AppData {
  return {
    version: DATA_VERSION,
    questions: [],
    attempts: [],
    sessions: [],
    redacoes: [],
    favorites: [],
    reviewedAt: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

const SERVER_SNAPSHOT = defaultData();

let data: AppData | null = null;
let hydrated = false;
let userUpdatedAt = 0;
let qUpdatedAt = 0;
let applyingRemote = false;

const listeners = new Set<() => void>();
let userTimer: ReturnType<typeof setTimeout> | null = null;
let qTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l();
}

/* ------------------------------------------------------------------ */
/* Normalização                                                        */
/* ------------------------------------------------------------------ */

type Rec = Record<string, unknown>;
const asStr = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const asObj = (v: unknown): Rec => (v && typeof v === "object" ? (v as Rec) : {});

const DIFFS = new Set<Difficulty>(["facil", "media", "dificil"]);
const asDifficulty = (v: unknown): Difficulty | undefined =>
  typeof v === "string" && DIFFS.has(v as Difficulty) ? (v as Difficulty) : undefined;

function asStrMap(v: unknown): Record<string, string> | undefined {
  if (!v || typeof v !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Rec)) {
    if (typeof val === "string" && val.trim()) out[k] = val;
  }
  return Object.keys(out).length ? out : undefined;
}

function normQuestion(v: unknown): Question {
  const q = asObj(v);
  const year = Number(q.year);
  return {
    id: asStr(q.id) || genId(),
    subject: asStr(q.subject),
    topic: asStr(q.topic),
    statement: asStr(q.statement),
    options: Array.isArray(q.options) ? (q.options as Question["options"]) : [],
    correctOption: asStr(q.correctOption),
    explanation: asStr(q.explanation) || undefined,
    optionComments: asStrMap(q.optionComments),
    year: Number.isFinite(year) && year > 1990 ? year : undefined,
    difficulty: asDifficulty(q.difficulty),
    skill: asStr(q.skill) || undefined,
    imageUrl: asStr(q.imageUrl) || undefined,
    possiblyHasImage: !!q.possiblyHasImage,
    source: asStr(q.source) || undefined,
    createdAt: asStr(q.createdAt) || new Date().toISOString(),
  };
}

const normQuestions = (v: unknown): Question[] =>
  Array.isArray(v) ? v.map(normQuestion) : [];

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
    difficulty: asDifficulty(a.difficulty),
    timeSpent: typeof a.timeSpent === "number" ? a.timeSpent : 0,
    mode:
      a.mode === "prova" ? "prova" : a.mode === "prova-real" ? "prova-real" : "treino",
    createdAt: asStr(a.createdAt ?? a.date) || new Date().toISOString(),
  };
}

function normRedacao(v: unknown): Redacao {
  const r = asObj(v);
  return {
    id: asStr(r.id) || genId(),
    tema: asStr(r.tema),
    text: asStr(r.text),
    createdAt: asStr(r.createdAt) || new Date().toISOString(),
    correcao:
      r.correcao && typeof r.correcao === "object"
        ? (r.correcao as Redacao["correcao"])
        : undefined,
  };
}

/** Parte "usuário" do AppData (tudo menos as questões). */
function coerceUser(input: unknown): Omit<AppData, "questions"> {
  const parsed = asObj(input);
  const base = defaultData();
  return {
    version: DATA_VERSION,
    attempts: Array.isArray(parsed.attempts)
      ? parsed.attempts.map(normAttempt)
      : base.attempts,
    sessions: Array.isArray(parsed.sessions)
      ? (parsed.sessions as Session[])
      : base.sessions,
    redacoes: Array.isArray(parsed.redacoes)
      ? parsed.redacoes.map(normRedacao)
      : base.redacoes,
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

/* ------------------------------------------------------------------ */
/* Migração dos dados antigos                                          */
/* ------------------------------------------------------------------ */

function readLegacyArray(key: string): Rec[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(asObj) : [];
  } catch {
    return [];
  }
}

function migrateVeryOld(): AppData | null {
  const lq = readLegacyArray("estudos_amor_questions");
  const lh = readLegacyArray("estudos_amor_history");
  const lf = readLegacyArray("estudos_amor_favorites");
  if (!lq.length && !lh.length && !lf.length) return null;

  const base = defaultData();
  const byStatement = new Map<string, string>();

  base.questions = lq.map((q) => {
    const id = asStr(q.id) || genId();
    const statement = asStr(q.statement);
    if (statement) byStatement.set(statement, id);
    return normQuestion({ ...q, id, statement });
  });

  base.attempts = lh.map((h) =>
    normAttempt({
      ...h,
      questionId: byStatement.get(asStr(h.statement)) ?? "",
    }),
  );

  base.favorites = Array.from(
    new Set(
      lf
        .map((f) => byStatement.get(asStr(f.statement)))
        .filter((id): id is string => typeof id === "string"),
    ),
  );

  return base;
}

/* ------------------------------------------------------------------ */
/* Hidratação e persistência                                           */
/* ------------------------------------------------------------------ */

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    const rawUser = localStorage.getItem(USER_KEY);
    const rawQ = localStorage.getItem(Q_KEY);
    const rawLegacy = localStorage.getItem(LEGACY_KEY);

    if (rawUser || rawQ) {
      const user = coerceUser(rawUser ? JSON.parse(rawUser) : {});
      const questions = normQuestions(rawQ ? JSON.parse(rawQ) : []);
      data = { ...user, questions };
      userUpdatedAt = Number(localStorage.getItem(USER_TS)) || 1;
      qUpdatedAt = Number(localStorage.getItem(Q_TS)) || (questions.length ? 1 : 0);
    } else if (rawLegacy) {
      // migra o formato combinado antigo → dois blocos
      const parsed = asObj(JSON.parse(rawLegacy));
      data = {
        ...coerceUser(parsed),
        questions: normQuestions(parsed.questions),
      };
      userUpdatedAt = Date.now();
      qUpdatedAt = data.questions.length ? Date.now() : 0;
      writeLocalUser();
      writeLocalQuestions();
      try {
        localStorage.removeItem(LEGACY_KEY);
        localStorage.removeItem("ea:v2:ts");
      } catch {
        /* noop */
      }
    } else {
      const veryOld = migrateVeryOld();
      data = veryOld ?? defaultData();
      userUpdatedAt = veryOld ? Date.now() : 0;
      qUpdatedAt = veryOld && veryOld.questions.length ? Date.now() : 0;
      writeLocalUser();
      writeLocalQuestions();
    }
  } catch {
    data = defaultData();
    userUpdatedAt = 0;
    qUpdatedAt = 0;
  }

  attachRemote();
  emit();
}

function userSlice(d: AppData) {
  const { questions: _q, ...rest } = d;
  void _q;
  return rest;
}

function writeLocalUser() {
  if (!data || typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(userSlice(data)));
    localStorage.setItem(USER_TS, String(userUpdatedAt));
  } catch (e) {
    console.warn("[store] falha ao gravar user:", e);
  }
}

function writeLocalQuestions() {
  if (!data || typeof window === "undefined") return;
  try {
    localStorage.setItem(Q_KEY, JSON.stringify(data.questions));
    localStorage.setItem(Q_TS, String(qUpdatedAt));
  } catch (e) {
    console.warn("[store] falha ao gravar questions:", e);
  }
}

function pushUser() {
  if (!rtdb || !data) return;
  try {
    const payload = JSON.parse(
      JSON.stringify({ ...userSlice(data), updatedAt: userUpdatedAt }),
    );
    rtdbSet(ref(rtdb, RTDB_USER), payload).catch((e) =>
      console.warn("[store] sync user falhou:", e),
    );
  } catch (e) {
    console.warn("[store] sync user falhou:", e);
  }
}

function pushQuestions() {
  if (!rtdb || !data) return;
  try {
    const payload = JSON.parse(
      JSON.stringify({ list: data.questions, updatedAt: qUpdatedAt }),
    );
    rtdbSet(ref(rtdb, RTDB_Q), payload).catch((e) =>
      console.warn("[store] sync questions falhou:", e),
    );
  } catch (e) {
    console.warn("[store] sync questions falhou:", e);
  }
}

function scheduleUser() {
  writeLocalUser();
  if (userTimer) clearTimeout(userTimer);
  userTimer = setTimeout(pushUser, 600);
}

function scheduleQuestions() {
  writeLocalQuestions();
  if (qTimer) clearTimeout(qTimer);
  qTimer = setTimeout(pushQuestions, 800);
}

function attachRemote() {
  if (!rtdb) return;

  onValue(ref(rtdb, RTDB_USER), (snap) => {
    const remote = snap.val();
    if (!remote || typeof remote !== "object" || !data) return;
    const ts = Number(remote.updatedAt ?? 0);
    if (ts <= userUpdatedAt) return;
    applyingRemote = true;
    data = { ...coerceUser(remote), questions: data.questions };
    userUpdatedAt = ts;
    writeLocalUser();
    applyingRemote = false;
    emit();
  });

  onValue(ref(rtdb, RTDB_Q), (snap) => {
    const remote = snap.val();
    if (!remote || typeof remote !== "object" || !data) return;
    const ts = Number(remote.updatedAt ?? 0);
    if (ts <= qUpdatedAt) return;
    applyingRemote = true;
    data = { ...data, questions: normQuestions(remote.list) };
    qUpdatedAt = ts;
    writeLocalQuestions();
    applyingRemote = false;
    emit();
  });
}

/* ------------------------------------------------------------------ */
/* Mutações                                                            */
/* ------------------------------------------------------------------ */

function clone(d: AppData): AppData {
  return {
    ...d,
    questions: [...d.questions],
    attempts: [...d.attempts],
    sessions: [...d.sessions],
    redacoes: [...d.redacoes],
    favorites: [...d.favorites],
    reviewedAt: { ...d.reviewedAt },
    settings: { ...d.settings },
  };
}

function mutateUser(fn: (d: AppData) => void) {
  if (typeof window === "undefined") return;
  if (!hydrated) hydrate();
  if (!data) data = defaultData();
  fn(data);
  data = clone(data);
  if (!applyingRemote) {
    userUpdatedAt = Date.now();
    scheduleUser();
  }
  emit();
}

function mutateQuestions(fn: (d: AppData) => void) {
  if (typeof window === "undefined") return;
  if (!hydrated) hydrate();
  if (!data) data = defaultData();
  fn(data);
  data = clone(data);
  if (!applyingRemote) {
    qUpdatedAt = Date.now();
    scheduleQuestions();
  }
  emit();
}

export function addQuestion(
  q: Omit<Question, "id" | "createdAt"> & { id?: string; createdAt?: string },
): string {
  const id = q.id ?? genId();
  mutateQuestions((d) => {
    d.questions.push({ ...q, id, createdAt: q.createdAt ?? new Date().toISOString() });
  });
  return id;
}

export function addQuestions(
  list: Array<Omit<Question, "id" | "createdAt"> & { id?: string }>,
): string[] {
  const ids: string[] = [];
  mutateQuestions((d) => {
    for (const q of list) {
      const id = q.id ?? genId();
      ids.push(id);
      d.questions.push({ ...q, id, createdAt: new Date().toISOString() });
    }
  });
  return ids;
}

export function updateQuestion(id: string, patch: Partial<Question>) {
  mutateQuestions((d) => {
    const i = d.questions.findIndex((q) => q.id === id);
    if (i >= 0) d.questions[i] = { ...d.questions[i], ...patch, id };
  });
}

export function deleteQuestion(id: string) {
  mutateQuestions((d) => {
    d.questions = d.questions.filter((q) => q.id !== id);
    d.favorites = d.favorites.filter((f) => f !== id);
  });
}

export function recordAttempt(a: Omit<Attempt, "id" | "createdAt">): string {
  const id = genId();
  mutateUser((d) => {
    d.attempts.push({ ...a, id, createdAt: new Date().toISOString() });
  });
  return id;
}

export function updateAttempt(id: string, patch: Partial<Attempt>) {
  mutateUser((d) => {
    const i = d.attempts.findIndex((a) => a.id === id);
    if (i >= 0) d.attempts[i] = { ...d.attempts[i], ...patch, id };
  });
}

export function deleteAttempt(id: string) {
  mutateUser((d) => {
    d.attempts = d.attempts.filter((a) => a.id !== id);
  });
}

export function clearAttempts() {
  mutateUser((d) => {
    d.attempts = [];
    d.sessions = [];
    d.reviewedAt = {};
  });
}

export function saveSession(s: Omit<Session, "id" | "createdAt">): string {
  const id = genId();
  mutateUser((d) => {
    d.sessions.push({ ...s, id, createdAt: new Date().toISOString() });
  });
  return id;
}

export function toggleFavorite(questionId: string) {
  mutateUser((d) => {
    d.favorites = d.favorites.includes(questionId)
      ? d.favorites.filter((f) => f !== questionId)
      : [...d.favorites, questionId];
  });
}

export function markReviewed(questionId: string) {
  mutateUser((d) => {
    d.reviewedAt[questionId] = new Date().toISOString();
  });
}

export function updateSettings(patch: Partial<Settings>) {
  mutateUser((d) => {
    d.settings = { ...d.settings, ...patch };
  });
}

export function addRedacao(r: Omit<Redacao, "id" | "createdAt">): string {
  const id = genId();
  mutateUser((d) => {
    d.redacoes.push({ ...r, id, createdAt: new Date().toISOString() });
  });
  return id;
}

export function updateRedacao(id: string, patch: Partial<Redacao>) {
  mutateUser((d) => {
    const i = d.redacoes.findIndex((r) => r.id === id);
    if (i >= 0) d.redacoes[i] = { ...d.redacoes[i], ...patch, id };
  });
}

export function deleteRedacao(id: string) {
  mutateUser((d) => {
    d.redacoes = d.redacoes.filter((r) => r.id !== id);
  });
}

export function exportData(): AppData {
  if (!hydrated) hydrate();
  return data ?? defaultData();
}

export function importData(incoming: unknown, mode: "merge" | "replace" = "merge") {
  const raw = asObj(incoming);
  const source =
    raw.questions || raw.attempts || raw.settings
      ? raw
      : { questions: raw.questions, attempts: raw.history, favorites: raw.favorites };
  const user = coerceUser(source);
  const questions = normQuestions(asObj(source).questions);

  const applyQ = (d: AppData) => {
    if (mode === "replace") {
      d.questions = questions;
      return;
    }
    const ids = new Set(d.questions.map((q) => q.id));
    for (const q of questions) if (!ids.has(q.id)) d.questions.push(q);
  };
  const applyUser = (d: AppData) => {
    if (mode === "replace") {
      d.attempts = user.attempts;
      d.sessions = user.sessions;
      d.redacoes = user.redacoes;
      d.favorites = user.favorites;
      d.reviewedAt = user.reviewedAt;
      d.settings = user.settings;
      return;
    }
    const aIds = new Set(d.attempts.map((a) => a.id));
    for (const a of user.attempts) if (!aIds.has(a.id)) d.attempts.push(a);
    const sIds = new Set(d.sessions.map((s) => s.id));
    for (const s of user.sessions) if (!sIds.has(s.id)) d.sessions.push(s);
    const rIds = new Set(d.redacoes.map((r) => r.id));
    for (const r of user.redacoes) if (!rIds.has(r.id)) d.redacoes.push(r);
    d.favorites = Array.from(new Set([...d.favorites, ...user.favorites]));
    d.reviewedAt = { ...d.reviewedAt, ...user.reviewedAt };
  };

  if (questions.length) mutateQuestions(applyQ);
  mutateUser(applyUser);
}

/** Zera o progresso da aluna (tentativas, sessões, redações, favoritas).
 *  Não mexe no banco de questões. */
export function resetData() {
  mutateUser((d) => {
    const keepName = d.settings.name;
    d.attempts = [];
    d.sessions = [];
    d.redacoes = [];
    d.favorites = [];
    d.reviewedAt = {};
    d.settings = { ...DEFAULT_SETTINGS, name: keepName, onboarded: true };
  });
}

/** Apaga TODAS as questões do banco. */
export function clearQuestions() {
  mutateQuestions((d) => {
    d.questions = [];
    d.favorites = [];
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

const getSnapshot = (): AppData => data ?? SERVER_SNAPSHOT;
const getServerSnapshot = (): AppData => SERVER_SNAPSHOT;

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated && data !== null,
    () => false,
  );
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  return [useAppData().settings, updateSettings];
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

export function useRedacoes(): Redacao[] {
  return useAppData().redacoes;
}
