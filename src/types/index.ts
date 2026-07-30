export interface Subject {
  id: string;
  name: string; // ex: "Matemática"
}

export interface Topic {
  id: string;
  name: string; // ex: "Razão e Proporção"
  subjectId: string;
}

export interface QuestionOption {
  letter: string; // "A" | "B" | "C" | "D" | "E"
  text: string;
}

export interface Question {
  id: string;
  statement: string; // Enunciado
  imageUrl?: string;
  topicId: string;
  options: QuestionOption[];
  correctOption: string; // ex: "D"
}

export type ErrorReason =
  | "Não sabia o conteúdo"
  | "Errei o cálculo"
  | "Não entendi a questão"
  | "Falta de atenção"
  | "Chutei";

export interface Attempt {
  id?: string;
  questionId: string;
  userId: string; // fixo por enquanto
  isCorrect: boolean;
  userAnswer: string;
  reason?: ErrorReason;
  timeSpent: number; // segundos
  isFavorite: boolean;
  createdAt: Date;
}