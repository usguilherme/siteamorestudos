"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Question } from "@/types";

export default function ResolverQuestoesPage({ params }: { params: { id: string } }) {
  const topicId = params.id;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const USER_ID = "usuario-fixo";

  // Busca as questões do Firebase que pertencem a este assunto
  useEffect(() => {
    async function fetchQuestions() {
      const q = query(collection(db, "questions"), where("topicId", "==", topicId));
      const querySnapshot = await getDocs(q);
      const fetchedQuestions: Question[] = [];
      querySnapshot.forEach((doc) => {
        fetchedQuestions.push({ id: doc.id, ...doc.data() } as Question);
      });
      setQuestions(fetchedQuestions);
      setLoading(false);
    }
    fetchQuestions();
  }, [topicId]);

  const handleAnswer = async () => {
    if (!selectedOption) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedOption === currentQuestion.correctOption;

    setFeedback({
      isCorrect,
      msg: isCorrect ? "🎉 Resposta Certa! Muito bem!" : "❌ Resposta Errada. Não desanime!",
    });

    // Salva a tentativa no histórico (para as estatísticas e tela de erros funcionarem)
    await addDoc(collection(db, "attempts"), {
      userId: USER_ID,
      questionId: currentQuestion.id,
      topicId,
      isCorrect,
      userAnswer: selectedOption,
      isFavorite: false, 
      createdAt: serverTimestamp(),
    });
  };

  const nextQuestion = () => {
    setSelectedOption("");
    setFeedback(null);
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Carregando questões... ⏳</div>;

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="mb-4 text-2xl font-bold text-slate-800">Nenhuma questão encontrada 😢</h1>
        <p className="mb-6 text-slate-500">Ainda não há questões cadastradas para este assunto.</p>
        <Link href="/materias" className="font-semibold text-emerald-600 hover:underline">← Voltar para as matérias</Link>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;

  // Tela exibida quando ela termina todas as questões do assunto
  if (isFinished) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center mt-10">
        <h1 className="mb-4 text-3xl font-bold text-emerald-600">Fim da Revisão! 🎉</h1>
        <p className="mb-8 text-slate-600">Você respondeu todas as questões deste assunto.</p>
        <Link href="/materias" className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-emerald-700">
          Escolher outra matéria
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link href={`/materias`} className="mb-6 inline-block text-sm font-medium text-emerald-600 hover:underline">
        ← Voltar
      </Link>
      
      <div className="mb-4 flex items-center justify-between text-sm font-medium text-slate-500">
        <span>Questão {currentIndex + 1} de {questions.length}</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-8 text-lg font-medium text-slate-800">{currentQ.statement}</p>

        <div className="space-y-3">
          {currentQ.options.map((opt) => (
            <button
              key={opt.letter}
              disabled={feedback !== null}
              onClick={() => setSelectedOption(opt.letter)}
              className={`w-full rounded-lg border p-4 text-left transition ${
                selectedOption === opt.letter 
                  ? "border-emerald-500 bg-emerald-50" 
                  : "border-slate-200 hover:bg-slate-50"
              } ${feedback !== null ? "cursor-not-allowed opacity-70" : ""}`}
            >
              <span className="mr-3 font-bold text-slate-500">{opt.letter})</span>
              {opt.text}
            </button>
          ))}
        </div>

        {feedback && (
          <div className={`mt-6 rounded-lg p-4 text-center font-bold ${feedback.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
            {feedback.msg}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          {!feedback ? (
            <button
              onClick={handleAnswer}
              disabled={!selectedOption}
              className="rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Responder
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Próxima Questão →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}