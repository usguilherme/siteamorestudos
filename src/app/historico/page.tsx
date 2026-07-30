"use client";

import { useEffect, useState } from "react";

export default function HistoricoPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("TODOS");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("estudos_amor_history") || "[]");
    // Ordena do mais recente para o mais antigo
    setHistory(savedHistory.reverse());
  }, []);

  const handleClearHistory = () => {
    localStorage.removeItem("estudos_amor_history");
    setHistory([]);
  };

  // Filtragem por período e busca por palavra-chave
  const filteredHistory = history.filter((item) => {
    // Filtro de busca por palavra-chave no enunciado
    const matchesSearch = item.statement.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Filtro de período
    if (filter === "TODOS") return true;

    const itemDate = new Date(item.date);
    const now = new Date();
    const diffTime = now.getTime() - itemDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (filter === "HOJE") {
      return diffDays < 1 && itemDate.getDate() === now.getDate();
    }
    if (filter === "7DIAS") {
      return diffDays <= 7;
    }
    if (filter === "30DIAS") {
      return diffDays <= 30;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">Histórico de Simulados 📚</h1>
          <p className="text-xs text-slate-500 sm:text-sm">Registro de todas as questões respondidas</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Buscar palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400"
          />

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="TODOS">Todo o Período</option>
            <option value="HOJE">Hoje</option>
            <option value="7DIAS">Últimos 7 dias</option>
            <option value="30DIAS">Últimos 30 dias</option>
          </select>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 shadow-sm"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-base font-medium text-slate-600 sm:text-lg">Nenhum histórico encontrado.</p>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">Responda questões no simulado para preencher seu histórico!</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-600">Nenhum registro encontrado para os filtros aplicados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item, index) => (
            <div 
              key={index} 
              className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                item.isCorrect ? 'border-emerald-200' : 'border-red-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                    item.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.isCorrect ? "✅ Acertou" : "❌ Errou"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {item.date ? new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Data não informada"}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 line-clamp-2">{item.statement}</p>
                <p className="text-xs text-slate-500">
                  Sua resposta: <strong className="font-bold">{item.selected}</strong> | Correta: <strong className="font-bold">{item.correct}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}