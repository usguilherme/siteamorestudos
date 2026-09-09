// Modelo de dados da plataforma. Tudo é persistido em localStorage e,
// opcionalmente, espelhado no Realtime Database (ver src/lib/store.ts).

export interface QuestionOption {
  letter: string; // "A" | "B" | "C" | "D" | "E"
  text: string;
}

export type Difficulty = "facil" | "media" | "dificil";

export const DIFFICULTIES: Difficulty[] = ["facil", "media", "dificil"];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: "Fácil",
  media: "Média",
  dificil: "Difícil",
};

export interface Question {
  id: string;
  subject: string; // nome completo da área do ENEM
  topic: string; // assunto específico
  statement: string;
  options: QuestionOption[];
  correctOption: string; // letra do gabarito ("" se desconhecido)
  explanation?: string; // comentário da alternativa correta
  optionComments?: Record<string, string>; // letra -> por que erra/acerta
  year?: number;
  difficulty?: Difficulty;
  skill?: string; // habilidade da Matriz de Referência do INEP (ex: "H12")
  imageUrl?: string;
  possiblyHasImage?: boolean;
  source?: string; // ex: nome do PDF de origem
  createdAt: string; // ISO
}

export type SimuladoMode = "treino" | "prova" | "prova-real";

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
  difficulty?: Difficulty;
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
  estimatedScore?: number; // 0-1000 (heurística ponderada por dificuldade)
  createdAt: string; // ISO
}

export interface CompetenciaScore {
  nota: number; // 0-200
  comentario: string;
}

export interface RedacaoCorrecao {
  c1: CompetenciaScore;
  c2: CompetenciaScore;
  c3: CompetenciaScore;
  c4: CompetenciaScore;
  c5: CompetenciaScore;
  total: number; // 0-1000
  resumo: string;
  pontosFortes: string[];
  aMelhorar: string[];
  model?: string;
  createdAt: string;
}

export interface Redacao {
  id: string;
  tema: string;
  text: string;
  createdAt: string;
  correcao?: RedacaoCorrecao;
}

export interface Settings {
  name: string;
  dailyGoal: number; // questões por dia
  enemDates: string[]; // ISO date (yyyy-mm-dd)
  theme: "light" | "dark" | "system";
  onboarded: boolean;
  diagnosticDone?: boolean;
}

export interface AppData {
  version: number;
  questions: Question[];
  attempts: Attempt[];
  sessions: Session[];
  redacoes: Redacao[];
  favorites: string[]; // questionId[]
  reviewedAt: Record<string, string>; // questionId -> ISO da última revisão
  settings: Settings;
}
