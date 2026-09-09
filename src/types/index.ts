// Modelo de dados da plataforma. Tudo é persistido em localStorage e,
// opcionalmente, espelhado no Realtime Database (ver src/lib/store.ts).

export interface QuestionOption {
  letter: string; // "A" | "B" | "C" | "D" | "E"
  text: string;
}

export interface Question {
  id: string;
  subject: string; // nome completo da área do ENEM
  topic: string; // assunto específico
  statement: string;
  options: QuestionOption[];
  correctOption: string; // letra do gabarito ("" se desconhecido)
  explanation?: string;
  imageUrl?: string;
  possiblyHasImage?: boolean;
  source?: string; // ex: nome do PDF de origem
  createdAt: string; // ISO
}

export type SimuladoMode = "treino" | "prova";

export type QuestionSource =
  | "todas"
  | "erradas"
  | "nao-vistas"
  | "favoritas";

export const ERROR_REASONS = [
  "Não sabia o conteúdo",
  "Errei o cálculo",
  "Não entendi a questão",
  "Falta de atenção",
  "Chutei",
] as const;

export type ErrorReason = (typeof ERROR_REASONS)[number];

export interface Attempt {
  id: string;
  questionId: string;
  statement: string; // desnormalizado p/ histórico legível
  subject: string;
  topic: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  reason?: ErrorReason | null;
  timeSpent: number; // segundos nesta questão
  mode: SimuladoMode;
  createdAt: string; // ISO
}

export interface Session {
  id: string;
  mode: SimuladoMode;
  subject: string; // "TODAS" ou nome da área
  topic: string; // "TODOS" ou assunto
  questionSource: QuestionSource;
  total: number;
  correct: number;
  timeSpent: number; // segundos totais
  createdAt: string; // ISO
}

export interface Settings {
  name: string;
  dailyGoal: number; // questões por dia
  enemDates: string[]; // ISO date (yyyy-mm-dd)
  theme: "light" | "dark" | "system";
  onboarded: boolean;
}

export interface AppData {
  version: number;
  questions: Question[];
  attempts: Attempt[];
  sessions: Session[];
  favorites: string[]; // questionId[]
  reviewedAt: Record<string, string>; // questionId -> ISO da última revisão
  settings: Settings;
}
