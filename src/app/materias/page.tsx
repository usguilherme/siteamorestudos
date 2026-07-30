"use client";

import { useEffect, useState } from "react";

export default function MateriasPage() {
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("estudos_amor_questions") || "[]");
    setQuestions(saved);
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Matérias e Questões Salvas 📚</h1>
          <p className="text-sm text-slate-500">Banco de questões cadastradas na plataforma</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
          {questions.length} {questions.length === 1 ? "questão" : "questões"}
        </span>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-600">Nenhuma questão cadastrada ainda.</p>
          <p className="mt-1 text-sm text-slate-400">Vá até o painel Admin para começar a cadastrar!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id || index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-3">
                <span className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  {q.subject}
                </span>
                <span className="text-xs font-medium text-slate-500">{q.topic}</span>
              </div>
              
              <div className="p-6">
                <p className="mb-6 text-lg font-medium text-slate-800">{q.statement}</p>
                
                <div className="space-y-3">
                  {q.options.map((opt: any) => {
                    const isCorrect = opt.letter === q.correctOption;
                    return (
                      <div 
                        key={opt.letter} 
                        className={`flex items-center justify-between rounded-xl border p-3.5 text-sm transition ${
                          isCorrect 
                            ? 'border-emerald-500 bg-emerald-50/70 font-semibold text-emerald-900 shadow-sm' 
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {opt.letter}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isCorrect && (
                          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            ✅ Correta
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}