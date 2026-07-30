"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FavoritasPage() {
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const savedFavs = JSON.parse(localStorage.getItem("estudos_amor_favorites") || "[]");
    setFavorites(savedFavs.reverse()); // Mostra as mais recentes primeiro
  };

  const removeFavorite = (statement: string) => {
    const updated = favorites.filter((f) => f.statement !== statement);
    setFavorites(updated);
    // Salva mantendo a ordem correta no localStorage (inverte de volta para salvar cronologicamente)
    localStorage.setItem("estudos_amor_favorites", JSON.stringify([...updated].reverse()));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">Questões Favoritas ⭐</h1>
          <p className="text-xs text-slate-500 sm:text-sm">Seu caderno personalizado com as questões marcadas para revisão</p>
        </div>
        
        <span className="self-start sm:self-auto rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200 shadow-sm">
          {favorites.length} {favorites.length === 1 ? "questão salva" : "questões salvas"}
        </span>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-base font-medium text-slate-600 sm:text-lg">Nenhuma questão favoritada ainda.</p>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">Durante os simulados, clique no botão de favoritar (⭐) para salvá-las aqui!</p>
          <div className="mt-6">
            <Link
              href="/simulado"
              className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
            >
              Ir para o Simulado 📝
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {favorites.map((q, index) => (
            <div key={q.id || index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    {q.subject}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{q.topic}</span>
                </div>
                <button
                  onClick={() => removeFavorite(q.statement)}
                  className="self-start sm:self-auto rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 shadow-sm"
                >
                  Remover Favorita ⭐
                </button>
              </div>

              <p className="text-sm font-medium text-slate-800 sm:text-base">{q.statement}</p>

              <div className="space-y-2 text-xs sm:text-sm">
                {q.options.map((opt: any) => {
                  const isCorrect = opt.letter === q.correctOption;
                  return (
                    <div 
                      key={opt.letter} 
                      className={`rounded-xl border p-3 transition ${
                        isCorrect 
                          ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-900 shadow-sm' 
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