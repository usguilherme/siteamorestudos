"use client";

import { useEffect, useState } from "react";
import { calculateAccuracy, formatTime, getUniqueQuestionsCount } from "@/lib/utils";

const ENEM_MATERIAS_NAMES = [
  "Matemática e suas Tecnologias",
  "Linguagens, Códigos e suas Tecnologias",
  "Ciências Humanas e suas Tecnologias",
  "Ciências da Natureza e suas Tecnologias"
];

export default function EstatisticasGlobaisPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("estudos_amor_history") || "[]");
    const savedQuestions = JSON.parse(localStorage.getItem("estudos_amor_questions") || "[]");
    const savedFavorites = JSON.parse(localStorage.getItem("estudos_amor_favorites") || "[]");
    
    setHistory(savedHistory);
    setQuestions(savedQuestions);
    setFavorites(savedFavorites);
  }, []);

  const totalAttempts = history.length;
  const correctAttempts = history.filter((h) => h.isCorrect).length;
  const incorrectAttempts = totalAttempts - correctAttempts;
  const accuracy = calculateAccuracy(history);
  const uniqueAnswered = getUniqueQuestionsCount(history);
  const totalRegistered = questions.length;
  const totalFavorites = favorites.length;

  const uniqueDays = new Set(
    history.map((h) => (h.date ? new Date(h.date).toDateString() : null)).filter(Boolean)
  ).size;

  const coveragePercentage = totalRegistered > 0 ? Math.round((uniqueAnswered / totalRegistered) * 100) : 0;

  // Desempenho por Matéria
  const subjectStats = ENEM_MATERIAS_NAMES.map((subjectName) => {
    const subjectAttempts = history.filter((h) => {
      const foundQ = questions.find((q) => q.id === h.questionId || q.statement === h.statement);
      return foundQ ? foundQ.subject === subjectName : false;
    });

    const total = subjectAttempts.length;
    const correct = subjectAttempts.filter((h) => h.isCorrect).length;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      name: subjectName,
      shortName: subjectName.split(" ")[0],
      total,
      correct,
      accuracy: acc
    };
  });

  let executiveStatus = "Iniciando a jornada de estudos 🚀";
  if (accuracy >= 80 && totalAttempts >= 10) {
    executiveStatus = "Excelente desempenho! Alto nível de domínio nas questões praticadas 🌟";
  } else if (accuracy >= 60) {
    executiveStatus = "Bom ritmo de evolução. Continue revisando os erros para consolidar o aprendizado 📈";
  } else if (totalAttempts > 0) {
    executiveStatus = "Atenção necessária em pontos de revisão. Foco nas questões erradas 💡";
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">Resumo Executivo de Estudos 📋</h1>
        <p className="text-xs text-slate-500 sm:text-sm">Panorama executivo completo do seu progresso e métricas globais</p>
      </div>

      {/* Card de Status Executivo */}
      <div className="mb-6 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Status Geral da Jornada</p>
        <p className="mt-2 text-lg font-extrabold text-slate-800 sm:text-xl">{executiveStatus}</p>
        <p className="mt-1 text-xs text-slate-600">
          Você já registrou {totalAttempts} resoluções distribuídas ao longo de {uniqueDays} dias de estudo ativos.
        </p>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Aproveitamento Global</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-600">{accuracy}%</p>
          <p className="mt-1 text-xs text-slate-500">{correctAttempts} acertos e {incorrectAttempts} erros</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Banco de Questões</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-800">{uniqueAnswered} <span className="text-base font-normal text-slate-400">/ {totalRegistered}</span></p>
          <p className="mt-1 text-xs text-slate-500">{coveragePercentage}% do banco total treinado</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Questões Favoritas</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-500">{totalFavorites}</p>
          <p className="mt-1 text-xs text-slate-500">Marcadas para revisão prioritária</p>
        </div>
      </div>

      {/* Seção de Gráficos de Desempenho por Matéria */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-800">Desempenho Detalhado por Matéria 📊</h2>

        <div className="space-y-5">
          {subjectStats.map((sub) => (
            <div key={sub.name} className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-700">{sub.name}</span>
                <span className="font-bold text-slate-800">
                  {sub.accuracy}% <span className="font-normal text-slate-400">({sub.correct}/{sub.total} acertos)</span>
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    sub.accuracy >= 70 ? 'bg-emerald-500' : sub.accuracy >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                  }`} 
                  style={{ width: `${sub.accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detalhamento de Atividade e Cobertura */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-800">Indicadores de Produtividade ⚙️</h2>

        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">Taxa de Acertos Geral</span>
              <span className="font-bold text-blue-600">{accuracy}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">Cobertura do Banco Cadastrado</span>
              <span className="font-bold text-emerald-600">{coveragePercentage}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(coveragePercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-center sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Dias Ativos</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{uniqueDays}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Total Tentativas</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{totalAttempts}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Acertos</p>
            <p className="mt-1 text-lg font-bold text-emerald-600">{correctAttempts}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Erros</p>
            <p className="mt-1 text-lg font-bold text-red-600">{incorrectAttempts}</p>
          </div>
        </div>
      </div>
    </div>
  );
}