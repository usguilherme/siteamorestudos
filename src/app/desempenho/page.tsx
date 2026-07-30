"use client";

import { useEffect, useState } from "react";
import { calculateAccuracy, formatTime, getUniqueQuestionsCount } from "@/lib/utils";

const ENEM_MATERIAS = [
  "Matemática e suas Tecnologias",
  "Linguagens, Códigos e suas Tecnologias",
  "Ciências Humanas e suas Tecnologias",
  "Ciências da Natureza e suas Tecnologias",
];

export default function DesempenhoPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("estudos_amor_history") || "[]");
    const savedQuestions = JSON.parse(localStorage.getItem("estudos_amor_questions") || "[]");
    setHistory(savedHistory);
    setQuestions(savedQuestions);
  }, []);

  const totalAttempts = history.length;
  const correctAttempts = history.filter((h) => h.isCorrect).length;
  const incorrectAttempts = totalAttempts - correctAttempts;
  const accuracy = calculateAccuracy(history);
  const uniqueAnswered = getUniqueQuestionsCount(history);
  const totalRegisteredQuestions = questions.length;
  
  const progressPercentage = totalRegisteredQuestions > 0 
    ? Math.round((uniqueAnswered / totalRegisteredQuestions) * 100) 
    : 0;

  // Estatísticas por matéria
  const subjectStats = ENEM_MATERIAS.map((subjectName) => {
    const subjectQuestionStatements = new Set(
      questions.filter((q) => q.subject === subjectName).map((q) => q.statement)
    );

    const subjectAttempts = history.filter((h) => subjectQuestionStatements.has(h.statement));
    const subTotal = subjectAttempts.length;
    const subCorrect = subjectAttempts.filter((h) => h.isCorrect).length;
    const subAccuracy = subTotal > 0 ? Math.round((subCorrect / subTotal) * 100) : 0;

    return {
      name: subjectName,
      total: subTotal,
      correct: subCorrect,
      accuracy: subAccuracy,
    };
  });

  // Estatísticas por assunto específico (topic)
  const topicMap: { [topicName: string]: { total: number; correct: number; subject: string } } = {};
  
  // Mapeia cada enunciado ao seu respectivo tópico e matéria
  const questionTopicMap = new Map<string, { topic: string; subject: string }>();
  questions.forEach((q) => {
    if (q.statement && q.topic) {
      questionTopicMap.set(q.statement, { topic: q.topic, subject: q.subject });
    }
  });

  history.forEach((h) => {
    const qInfo = questionTopicMap.get(h.statement);
    if (qInfo && qInfo.topic) {
      if (!topicMap[qInfo.topic]) {
        topicMap[qInfo.topic] = { total: 0, correct: 0, subject: qInfo.subject };
      }
      topicMap[qInfo.topic].total += 1;
      if (h.isCorrect) {
        topicMap[qInfo.topic].correct += 1;
      }
    }
  });

  const topicStats = Object.keys(topicMap).map((topicName) => {
    const data = topicMap[topicName];
    return {
      topic: topicName,
      subject: data.subject,
      total: data.total,
      correct: data.correct,
      accuracy: Math.round((data.correct / data.total) * 100),
    };
  }).sort((a, b) => b.total - a.total); // Ordena pelos mais praticados

  // Agrupamento temporal para evolução
  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const timelineMap: { [dateStr: string]: { total: number; correct: number } } = {};
  
  sortedHistory.forEach((h) => {
    if (!h.date) return;
    const dateStr = new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    if (!timelineMap[dateStr]) {
      timelineMap[dateStr] = { total: 0, correct: 0 };
    }
    timelineMap[dateStr].total += 1;
    if (h.isCorrect) {
      timelineMap[dateStr].correct += 1;
    }
  });

  const timelineData = Object.keys(timelineMap).map((dateStr) => {
    const data = timelineMap[dateStr];
    return {
      date: dateStr,
      accuracy: Math.round((data.correct / data.total) * 100),
      total: data.total,
    };
  }).slice(-7);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">Desempenho Geral 📊</h1>
        <p className="text-xs text-slate-500 sm:text-sm">Acompanhe suas estatísticas de estudo e evolução nos simulados</p>
      </div>

      {totalAttempts === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-base font-medium text-slate-600 sm:text-lg">Nenhum dado de desempenho registrado ainda.</p>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">Responda questões no simulado para visualizar suas estatísticas detalhadas!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taxa de Acerto</p>
              <p className="mt-2 text-3xl font-extrabold text-blue-600">{accuracy}%</p>
              <p className="mt-1 text-xs text-slate-500">{correctAttempts} acertos de {totalAttempts} respostas</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Questões Respondidas</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-800">{uniqueAnswered}</p>
              <p className="mt-1 text-xs text-slate-500">De um total de {totalRegisteredQuestions} cadastradas</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Erros Registrados</p>
              <p className="mt-2 text-3xl font-extrabold text-red-600">{incorrectAttempts}</p>
              <p className="mt-1 text-xs text-slate-500">Disponíveis na aba de revisão</p>
            </div>
          </div>

          {/* Gráfico de Evolução Temporal */}
          {timelineData.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-800">Evolução Temporal da Taxa de Acerto 📈</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-7">
                {timelineData.map((item) => (
                  <div key={item.date} className="flex flex-col items-center justify-end rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                    <span className="text-xs font-bold text-blue-600">{item.accuracy}%</span>
                    <div className="my-2 h-20 w-3 rounded-full bg-slate-200 relative overflow-hidden flex items-end">
                      <div 
                        className="w-full bg-blue-600 rounded-full transition-all duration-500" 
                        style={{ height: `${item.accuracy}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600">{item.date}</span>
                    <span className="text-[10px] text-slate-400">{item.total} resp.</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desempenho por Matéria */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-800">Desempenho por Matéria 🎯</h2>
            <div className="space-y-5">
              {subjectStats.map((sub) => (
                <div key={sub.name} className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
                    <span className="font-semibold text-slate-700">{sub.name}</span>
                    <span className="text-xs font-medium text-slate-500">
                      {sub.correct}/{sub.total} acertos (<strong className="text-blue-600">{sub.accuracy}%</strong>)
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-500 rounded-full" 
                      style={{ width: `${sub.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desempenho por Assunto Específico */}
          {topicStats.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-800">Desempenho por Assunto Específico 🔎</h2>
              <div className="space-y-4">
                {topicStats.map((top) => (
                  <div key={top.topic} className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
                      <div>
                        <span className="font-bold text-slate-800">{top.topic}</span>
                        <span className="ml-2 text-xs text-slate-400">({top.subject})</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        {top.correct}/{top.total} acertos (<strong className="text-blue-600">{top.accuracy}%</strong>)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div 
                        className="h-full bg-emerald-600 transition-all duration-500 rounded-full" 
                        style={{ width: `${top.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barra de Progresso Geral */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">Cobertura do Banco de Questões</span>
              <span className="font-bold text-blue-600">{progressPercentage}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full" 
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Você já treinou {uniqueAnswered} questões diferentes do seu banco total de {totalRegisteredQuestions}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}