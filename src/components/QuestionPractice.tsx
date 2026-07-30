"use client";

import { useEffect, useState } from "react";
import {
  getQuestionsByTopic,
  saveAttempt,
  updateAttemptReason,
} from "@/lib/questions";
import { Question, ErrorReason } from "@/types";

const REASONS: ErrorReason[] = [
  "Não sabia o conteúdo",
  "Errei o cálculo",
  "Não entendi a questão",
  "Falta de atenção",
  "Chutei",
];

// TODO: trocar por um id de usuário real quando o login for implementado
const USER_ID = "usuario-fixo";

interface Props {
  topicId: string;
}

export default function QuestionPractice({ topicId }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showReason, setShowReason] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getQuestionsByTopic(topicId);
      setQuestions(data);
      setLoading(false);
      setStartTime(Date.now());
    }
    load();
  }, [topicId]);

  const current = questions[index];

  async function handleAnswer(letter: string) {
    if (!current || selected) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const isCorrect = letter === current.correctOption;

    setSelected(letter);
    setResult(isCorrect ? "correct" : "wrong");

    const id = await saveAttempt({
      questionId: current.id,
      userId: USER_ID,
      isCorrect,
      userAnswer: letter,
      timeSpent,
      isFavorite: false,
    });
    setAttemptId(id);

    if (!isCorrect) setShowReason(true);
  }

  async function handleReason(reason: ErrorReason) {
    if (attemptId) await updateAttemptReason(attemptId, reason);
    setShowReason(false);
  }

  function handleNext() {
    setSelected(null);
    setResult(null);
    setAttemptId(null);
    setShowReason(false);
    setStartTime(Date.now());
    setIndex((i) => Math.min(i + 1, questions.length - 1));
  }

  if (loading) {
    return <p className="p-6 text-slate-500">Carregando questões…</p>;
  }

  if (!current) {
    return (
      <p className="p-6 text-slate-500">
        Nenhuma questão encontrada para este assunto.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <p className="mb-2 text-sm text-slate-400">
        Questão {index + 1} de {questions.length}
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-4 whitespace-pre-line text-slate-800">
          {current.statement}
        </p>

        {current.imageUrl && (
          <img
            src={current.imageUrl}
            alt="Imagem da questão"
            className="mb-4 rounded-lg"
          />
        )}

        <div className="space-y-2">
          {current.options.map((opt) => {
            const isSelected = selected === opt.letter;
            const isCorrectOption = opt.letter === current.correctOption;

            let style = "border-slate-200 hover:border-slate-400";
            if (selected) {
              if (isCorrectOption) style = "border-emerald-500 bg-emerald-50";
              else if (isSelected) style = "border-red-500 bg-red-50";
            }

            return (
              <button
                key={opt.letter}
                disabled={!!selected}
                onClick={() => handleAnswer(opt.letter)}
                className={`w-full rounded-lg border p-3 text-left transition ${style}`}
              >
                <span className="font-semibold">{opt.letter})</span> {opt.text}
              </button>
            );
          })}
        </div>

        {result && (
          <div
            className={`mt-4 rounded-lg p-3 text-sm font-medium ${
              result === "correct"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {result === "correct"
              ? "✅ Acertou!"
              : `❌ Errou — Resposta correta: ${current.correctOption}`}
          </div>
        )}

        {showReason && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-slate-500">Por que você errou?</p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => handleReason(r)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <button
            onClick={handleNext}
            disabled={index >= questions.length - 1}
            className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
          >
            Próxima questão →
          </button>
        )}
      </div>
    </div>
  );
}