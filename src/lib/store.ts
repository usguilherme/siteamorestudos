"use client";

// Camada de dados do app. Há DUAS fontes de questões, deliberadamente separadas:
//
//   1. Catálogo do ENEM — estático, somente leitura, versionado em
//      public/catalogo/, carregado sob demanda e cacheado pelo service worker.
//      NUNCA entra no localStorage inteiro, nunca sobe para o RTDB, nunca pode
//      ser apagado por sincronização. São ~2.600 questões idênticas em todo
//      aparelho — não são dado da aluna.
//
//   2. Dados da aluna — pequenos, mudam a cada questão respondida: tentativas,
//      redações, ajustes, favoritas E as questões que ela mesma cadastra.
//      Persistidos em localStorage e espelhados no Realtime Database.
//        valessa/questions  ->  { list: Question[] (só as dela), updatedAt }
//        valessa/user       ->  { ...resto do AppData, updatedAt }
//
// `useAppData().questions` devolve a UNIÃO das duas, com id prefixado por origem
// (catálogo = "enem-…") para nunca colidir.

import { useMemo, useSyncExternalStore } from "react";
import { onValue, ref, set as rtdbSet } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { DEFAULT_ENEM_DATES, areaName } from "@/lib/enem";
import { DIFFICULTIES } from "@/types";
import type {
  AppData,
  Attempt,
  Difficulty,
  Question,
  QuestionOption,
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
    difficultyRatings: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

const SERVER_SNAPSHOT = defaultData();

let data: AppData | null = null;
let hydrated = false;
let userUpdatedAt = 0;
let qUpdatedAt = 0;
let applyingRemote = false;

// true = a lista inteira do catálogo que a nuvem já entregou NÃO coube no disco
// deste aparelho. Enquanto estiver assim, não gravamos nem propagamos o bloco
// `questions`: um pedaço da lista com carimbo novo passaria a "vencer" a
// sincronização e apagaria o catálogo dos outros aparelhos. Zera sozinho quando
// um sync completo volta a caber.
let questionsIncomplete = false;

const listeners = new Set<() => void>();
let userTimer: ReturnType<typeof setTimeout> | null = null;
let qTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l();
}

/* ------------------------------------------------------------------ */
/* Armazenamento local: escrita segura e aviso de cota cheia           */
/*                                                                    */
/* Uma escrita que estoura a cota do localStorage NÃO pode passar em   */
/* silêncio nem avançar o relógio de last-write-wins — foi assim que o */
/* banco de questões sumiu sem ninguém ver. Quando falha, avisamos na  */
/* tela e o bloco fica só em memória: o disco continua intacto, então  */
/* a versão da nuvem volta a valer no próximo carregamento.            */
/* ------------------------------------------------------------------ */

const MSG_Q_FULL =
  "Sem espaço neste aparelho para guardar as questões offline. O banco do ENEM " +
  "vem da nuvem e não é afetado; suas respostas e favoritas também estão a " +
  "salvo. Só as questões que você cadastrar aqui podem não ficar guardadas se " +
  "usar o app sem internet.";
const MSG_USER_FULL =
  "Sem espaço para salvar neste aparelho. Seu progresso está sincronizando " +
  "pela nuvem, mas pode não ficar guardado se você usar o app offline.";

let storageError: string | null = null;
let storageErrorFor: "user" | "questions" | null = null;

function setStorageError(scope: "user" | "questions", msg: string) {
  if (storageErrorFor === scope && storageError === msg) return;
  storageErrorFor = scope;
  storageError = msg;
  emit();
}

function clearStorageError(scope: "user" | "questions") {
  if (storageErrorFor !== scope) return;
  storageErrorFor = null;
  storageError = null;
  emit();
}

function isQuotaError(e: unknown): boolean {
  return (
    typeof DOMException !== "undefined" &&
    e instanceof DOMException &&
    (e.name === "QuotaExceededError" ||
      e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      e.code === 22 ||
      e.code === 1014)
  );
}

/** Grava no localStorage tratando cota cheia explicitamente.
 *  Retorna true só se realmente persistiu. */
function safeSet(scope: "user" | "questions", key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    clearStorageError(scope);
    return true;
  } catch (e) {
    if (isQuotaError(e)) {
      setStorageError(scope, scope === "questions" ? MSG_Q_FULL : MSG_USER_FULL);
    } else {
      console.warn(`[store] falha ao gravar ${scope}:`, e);
    }
    return false;
  }
}

function numberOr(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}

/* ------------------------------------------------------------------ */
/* Catálogo estático do ENEM (public/catalogo/)                        */
/* ------------------------------------------------------------------ */

const CATALOG_AREAS = ["matematica", "linguagens", "humanas", "natureza"];

/** Prefixo de origem: ids do catálogo começam com "enem-". */
export function isCatalogId(id: string): boolean {
  return id.startsWith("enem-");
}

interface CatalogRecord {
  id: string;
  area: string;
  year: number;
  topic?: string;
  statement: string;
  options: QuestionOption[];
  correctOption: string;
  difficulty?: Difficulty;
  imageUrl?: string;
  possiblyHasImage?: boolean;
  source?: string;
}

function catalogToQuestion(r: CatalogRecord): Question {
  return {
    id: r.id,
    subject: areaName(r.area),
    topic: r.topic ?? "",
    statement: r.statement,
    options: Array.isArray(r.options) ? r.options : [],
    correctOption: r.correctOption ?? "",
    explanation: undefined,
    optionComments: undefined,
    year: Number.isFinite(r.year) ? r.year : undefined,
    difficulty: r.difficulty,
    skill: undefined,
    imageUrl: r.imageUrl || undefined,
    possiblyHasImage: !!r.possiblyHasImage,
    source: r.source || (r.year ? `ENEM ${r.year}` : undefined),
    createdAt: r.year ? `${r.year}-11-01T00:00:00.000Z` : new Date(0).toISOString(),
  };
}

let catalog: Question[] = [];
let catalogState: "idle" | "loading" | "ready" | "error" = "idle";

async function loadCatalog() {
  if (typeof window === "undefined") return;
  if (catalogState === "loading" || catalogState === "ready") return;
  catalogState = "loading";
  try {
    const parts = await Promise.all(
      CATALOG_AREAS.map((a) =>
        fetch(`/catalogo/${a}.json`, { cache: "force-cache" }).then((r) => {
          if (!r.ok) throw new Error(`${a}.json → ${r.status}`);
          return r.json() as Promise<CatalogRecord[]>;
        }),
      ),
    );
    catalog = parts.flat().map(catalogToQuestion);
    catalogState = "ready";
  } catch (e) {
    console.warn("[store] catálogo não carregou:", e);
    catalogState = "error";
  }
  invalidateSnapshot();
  emit();
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

/** questionId -> nível, descartando valores fora de facil|media|dificil. */
function coerceRatings(input: unknown): Record<string, Difficulty> {
  const out: Record<string, Difficulty> = {};
  if (input && typeof input === "object") {
    for (const [id, v] of Object.entries(input as Record<string, unknown>)) {
      if (DIFFICULTIES.includes(v as Difficulty)) out[id] = v as Difficulty;
    }
  }
  return out;
}

/** Nível efetivo de uma questão: o que a aluna marcou vence o do catálogo. */
export function effectiveDifficulty(
  q: Pick<Question, "id" | "difficulty">,
  ratings: Record<string, Difficulty>,
): Difficulty | undefined {
  return ratings[q.id] ?? q.difficulty;
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
    difficultyRatings: coerceRatings(parsed.difficultyRatings),
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
      const userParsed: unknown = rawUser ? JSON.parse(rawUser) : {};
      const qParsed: unknown = rawQ ? JSON.parse(rawQ) : null;

      // Formato atual: um único valor { list, updatedAt } / { ...user,
      // updatedAt }. Formato antigo: dado cru + timestamp numa chave à parte
      // (ea:v2:*_ts) — a escrita em dois passos que deixava carimbo novo sobre
      // lista velha quando a cota estourava. A leitura aceita os dois.
      const qList = Array.isArray(qParsed) ? qParsed : asObj(qParsed).list;
      const questions = normQuestions(qList);
      data = { ...coerceUser(userParsed), questions };

      const legacyUserTs = numberOr(localStorage.getItem(USER_TS));
      const legacyQTs = numberOr(localStorage.getItem(Q_TS));
      userUpdatedAt =
        numberOr(asObj(userParsed).updatedAt) || legacyUserTs || (rawUser ? 1 : 0);
      qUpdatedAt =
        numberOr(asObj(qParsed).updatedAt) || legacyQTs || (questions.length ? 1 : 0);

      // Consolida no formato de valor único e só então descarta as chaves de
      // timestamp soltas — nunca antes de a gravação combinada ter retornado.
      if (rawQ && (Array.isArray(qParsed) || legacyQTs) && writeLocalQuestions()) {
        try {
          localStorage.removeItem(Q_TS);
        } catch {
          /* noop */
        }
      }
      if (rawUser && !("updatedAt" in asObj(userParsed)) && writeLocalUser()) {
        try {
          localStorage.removeItem(USER_TS);
        } catch {
          /* noop */
        }
      }
    } else if (rawLegacy) {
      // migra o formato combinado antigo → dois blocos
      const parsed = asObj(JSON.parse(rawLegacy));
      data = {
        ...coerceUser(parsed),
        questions: normQuestions(parsed.questions),
      };
      userUpdatedAt = Date.now();
      qUpdatedAt = data.questions.length ? Date.now() : 0;
      const movedUser = writeLocalUser();
      const movedQ = writeLocalQuestions();
      // Só descarta o blob antigo se os dois blocos novos realmente
      // persistiram — senão a migração apagaria dado que não foi copiado.
      if (movedUser && movedQ) {
        try {
          localStorage.removeItem(LEGACY_KEY);
          localStorage.removeItem("ea:v2:ts");
        } catch {
          /* noop */
        }
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

  migrateCatalogOutOfStore();
  attachRemote();
  emit();
}

/** O catálogo do ENEM agora é estático (public/catalogo/). Se ainda houver
 *  questões dele — ou lixo sem área — no bloco `questions` da aluna, tira daqui:
 *  elas passam a vir do catálogo. Preserva as questões próprias dela e todo o
 *  histórico (attempts/favorites/reviewedAt não são tocados). */
function migrateCatalogOutOfStore() {
  if (!data) return;
  const before = data.questions.length;
  data.questions = data.questions.filter(
    (q) => !isCatalogId(q.id) && q.subject.trim() !== "",
  );
  if (data.questions.length === before) return;

  // Reescreve o bloco enxuto e propaga — isso também limpa o `valessa/questions`
  // no RTDB (que ainda carrega o catálogo + as questões de teste) na primeira
  // vez que este aparelho sincronizar com o código novo.
  qUpdatedAt = Date.now();
  if (writeLocalQuestions()) schedulePushQuestions();
}

function userSlice(d: AppData) {
  const { questions: _q, ...rest } = d;
  void _q;
  return rest;
}

// Lista/tabela e o carimbo de tempo vão num ÚNICO valor serializado: ou os dois
// persistem juntos, ou nenhum. Nunca mais "timestamp novo apontando para lista
// velha" — o estado que fazia o guard de last-write-wins rejeitar a nuvem para
// sempre.
function writeLocalUser(): boolean {
  if (!data || typeof window === "undefined") return false;
  return safeSet(
    "user",
    USER_KEY,
    JSON.stringify({ ...userSlice(data), updatedAt: userUpdatedAt }),
  );
}

function writeLocalQuestions(): boolean {
  if (!data || typeof window === "undefined") return false;
  return safeSet(
    "questions",
    Q_KEY,
    JSON.stringify({ list: data.questions, updatedAt: qUpdatedAt }),
  );
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

function schedulePushUser() {
  if (userTimer) clearTimeout(userTimer);
  userTimer = setTimeout(pushUser, 600);
}

function schedulePushQuestions() {
  if (qTimer) clearTimeout(qTimer);
  qTimer = setTimeout(pushQuestions, 800);
}

/** Persiste a mutação do bloco `user` e agenda o push — mas só avança o
 *  carimbo de tempo (e portanto só propaga) se a gravação local funcionou. */
function commitUser() {
  const prev = userUpdatedAt;
  userUpdatedAt = Date.now();
  if (writeLocalUser()) schedulePushUser();
  else userUpdatedAt = prev;
}

/** Idem para `questions`. Se o catálogo remoto não coube no disco, o bloco
 *  local é parcial: não gravamos por cima (viraria lista curta com carimbo
 *  novo, que a sincronização passaria a preferir) nem propagamos. */
function commitQuestions() {
  if (questionsIncomplete) {
    setStorageError("questions", MSG_Q_FULL);
    return;
  }
  const prev = qUpdatedAt;
  qUpdatedAt = Date.now();
  if (writeLocalQuestions()) schedulePushQuestions();
  else qUpdatedAt = prev;
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
    // O bloco `questions` do RTDB é só das questões próprias dela. Se ainda vier
    // catálogo antigo ou lixo sem área, ignora — o catálogo é estático agora.
    const own = normQuestions(remote.list).filter(
      (q) => !isCatalogId(q.id) && q.subject.trim() !== "",
    );
    data = { ...data, questions: own };
    qUpdatedAt = ts;
    questionsIncomplete = !writeLocalQuestions();
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
    difficultyRatings: { ...d.difficultyRatings },
    settings: { ...d.settings },
  };
}

function mutateUser(fn: (d: AppData) => void) {
  if (typeof window === "undefined") return;
  if (!hydrated) hydrate();
  if (!data) data = defaultData();
  fn(data);
  data = clone(data);
  if (!applyingRemote) commitUser();
  emit();
}

function mutateQuestions(fn: (d: AppData) => void) {
  if (typeof window === "undefined") return;
  if (!hydrated) hydrate();
  if (!data) data = defaultData();
  fn(data);
  data = clone(data);
  if (!applyingRemote) commitQuestions();
  emit();
}

// Prefixo "own-" nas questões que a aluna cadastra — nunca colide com o
// catálogo ("enem-…").
function ownId(): string {
  return `own-${genId()}`;
}

export function addQuestion(
  q: Omit<Question, "id" | "createdAt"> & { id?: string; createdAt?: string },
): string {
  const id = q.id ?? ownId();
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
      const id = q.id ?? ownId();
      ids.push(id);
      d.questions.push({ ...q, id, createdAt: new Date().toISOString() });
    }
  });
  return ids;
}

export function updateQuestion(id: string, patch: Partial<Question>) {
  if (isCatalogId(id)) return; // catálogo é somente leitura
  mutateQuestions((d) => {
    const i = d.questions.findIndex((q) => q.id === id);
    if (i >= 0) d.questions[i] = { ...d.questions[i], ...patch, id };
  });
}

export function deleteQuestion(id: string) {
  if (isCatalogId(id)) return; // catálogo é somente leitura
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

/** Registra (ou limpa, com `null`) o nível que a aluna sentiu na questão.
 *  Vale para o catálogo (somente leitura) e para as questões dela — fica no
 *  bloco `user`, não na questão. */
export function rateDifficulty(questionId: string, level: Difficulty | null) {
  mutateUser((d) => {
    if (level === null) delete d.difficultyRatings[questionId];
    else d.difficultyRatings[questionId] = level;
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

/** Só as questões próprias e o progresso — o catálogo do ENEM NÃO entra no
 *  backup, ele vem do app. */
export function exportData(): Omit<AppData, "questions"> & { questions: Question[] } {
  if (!hydrated) hydrate();
  const d = data ?? defaultData();
  return { ...userSlice(d), questions: d.questions.filter((q) => !isCatalogId(q.id)) };
}

export function importData(incoming: unknown, mode: "merge" | "replace" = "merge") {
  const raw = asObj(incoming);
  const source =
    raw.questions || raw.attempts || raw.settings
      ? raw
      : { questions: raw.questions, attempts: raw.history, favorites: raw.favorites };
  const user = coerceUser(source);
  // Nunca reimporta catálogo para o store — ele é estático.
  const questions = normQuestions(asObj(source).questions).filter(
    (q) => !isCatalogId(q.id) && q.subject.trim() !== "",
  );

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
      d.difficultyRatings = user.difficultyRatings;
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
    d.difficultyRatings = { ...d.difficultyRatings, ...user.difficultyRatings };
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
    d.difficultyRatings = {};
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
  if (catalogState === "idle") queueMicrotask(loadCatalog);
  return () => {
    listeners.delete(listener);
  };
}

// Snapshot = dados da aluna + catálogo, memoizado por identidade (o
// useSyncExternalStore exige referência estável). `data` vira objeto novo a cada
// mutação (clone); `catalog` vira array novo quando carrega — as duas checagens
// de identidade bastam.
let snapshotCache: AppData | null = null;
let snapshotFromData: AppData | null = null;
let snapshotFromCatalog: Question[] | null = null;

function invalidateSnapshot() {
  snapshotCache = null;
}

function getSnapshot(): AppData {
  if (!data) return SERVER_SNAPSHOT;
  if (!catalog.length) return data;
  if (
    snapshotCache &&
    snapshotFromData === data &&
    snapshotFromCatalog === catalog
  ) {
    return snapshotCache;
  }
  const ownIds = new Set(data.questions.map((q) => q.id));
  const extra = ownIds.size
    ? catalog.filter((q) => !ownIds.has(q.id))
    : catalog;
  snapshotCache = { ...data, questions: data.questions.concat(extra) };
  snapshotFromData = data;
  snapshotFromCatalog = catalog;
  return snapshotCache;
}
const getServerSnapshot = (): AppData => SERVER_SNAPSHOT;

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Só as questões que a aluna cadastrou (sem o catálogo). Para as telas de
 *  administração, que editam/apagam questões próprias. */
export function useOwnQuestions(): Question[] {
  return useSyncExternalStore(
    subscribe,
    () => (data ? data.questions : SERVER_SNAPSHOT.questions),
    () => SERVER_SNAPSHOT.questions,
  );
}

/** Estado do carregamento do catálogo estático. */
export function useCatalogState(): "idle" | "loading" | "ready" | "error" {
  return useSyncExternalStore(
    subscribe,
    () => catalogState,
    () => "idle" as const,
  );
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated && data !== null,
    () => false,
  );
}

/** Mensagem de erro de armazenamento local (cota cheia), ou null. */
export function useStorageError(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => storageError,
    () => null,
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

/** [ratings, rate] — ratings é questionId -> nível marcado pela aluna. */
export function useDifficultyRatings(): [
  Record<string, Difficulty>,
  (questionId: string, level: Difficulty | null) => void,
] {
  return [useAppData().difficultyRatings, rateDifficulty];
}

export function useAttempts(): Attempt[] {
  return useAppData().attempts;
}

export function useRedacoes(): Redacao[] {
  return useAppData().redacoes;
}
