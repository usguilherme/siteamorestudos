"use client";

import { useEffect, useState } from "react";

export default function RevisarErrosPage() {
  const [errorQuestions, setErrorQuestions] = useState<any[]>([]);
  const [hasErrors, setHasErrors] = useState(false);

  useEffect(() => {
    loadErrors();
  }, []);

  const loadErrors = () => {
    const savedHistory = JSON.parse(localStorage.getItem("estudos_amor_history") || "[]");
    const allQuestions = JSON.parse(localStorage.getItem("estudos_amor_questions") || "[]");

    const wrongStatements = savedHistory
      .filter((item: any) => !item.isCorrect)
      .map((item: any) => item.statement);

    const uniqueStatements = Array.from(new Set(wrongStatements));
    const filtered = allQuestions.filter((q: any) => uniqueStatements.includes(q.statement));
    
    setErrorQuestions(filtered);
    setHasErrors(savedHistory.some((item: any) => !item.isCorrect));
  };

  const clearErrorsHistory = () => {
    const savedHistory = JSON.parse(localStorage.getItem("estudos_amor_history") || "[]");
    const onlyCorrect = savedHistory.filter((item: any) => item.isCorrect);
    localStorage.setItem("estudos_amor_history", JSON.stringify(onlyCorrect));
    setErrorQuestions([]);
    setHasErrors(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">Revisão de Erros ❌</h1>
          <p className="text-xs text-slate-500 sm:text-sm">Questões que você errou nos simulados e precisa treinar novamente</p>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
            {errorQuestions.length} {errorQuestions.length === 1 ? "erro para revisar" : "erros para revisar"}
          </span>
          {hasErrors && (
            <button
              onClick={clearErrorsHistory}
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 shadow-sm"
            >
              Limpar Erros
            </button>
          )}
        </div>
      </div>

      {errorQuestions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-base font-medium text-slate-600 sm:text-lg">Nenhum erro registrado para revisão.</p>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">Continue fazendo os simulados para identificar pontos de melhoria!</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {errorQuestions.map((q, index) => (
            <div key={q.id || index} className="overflow-hidden rounded-2xl border border-red-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="self-start rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  {q.subject}
                </span>
                <span className="text-xs font-medium text-slate-500">{q.topic}</span>
              </div>

              <p className="mb-4 text-sm font-medium text-slate-800 sm:text-base">{q.statement}</p>

              <div className="space-y-2 text-xs sm:text-sm">
                {q.options.map((opt: any) => {
                  const isCorrect = opt.letter === q.correctOption;
                  return (
                    <div 
                      key={opt.letter} 
                      className={`rounded-xl border p-3 transition ${
                        isCorrect 
                          ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-900' 
                          : 'border-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="font-bold">{opt.letter})</span> {opt.text} {isCorrect && "✅ (Correta)"}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}