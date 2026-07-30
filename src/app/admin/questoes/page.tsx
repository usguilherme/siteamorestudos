"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const ENEM_MATERIAS = [
  {
    id: "mat",
    name: "Matemática e suas Tecnologias",
    topics: ["Aritmética e Operações Básicas", "Razão, Proporção e Regra de Três", "Porcentagem e Matemática Financeira", "Geometria Plana", "Funções"]
  },
  {
    id: "ling",
    name: "Linguagens, Códigos e suas Tecnologias",
    topics: ["Interpretação e Compreensão de Textos", "Funções da Linguagem", "Variação Linguística", "Literatura Brasileira"]
  },
  {
    id: "hum",
    name: "Ciências Humanas e suas Tecnologias",
    topics: ["História do Brasil", "História Geral", "Geografia Física e Cartografia", "Sociologia e Filosofia"]
  },
  {
    id: "nat",
    name: "Ciências da Natureza e suas Tecnologias",
    topics: ["Mecânica", "Termologia", "Eletrodinâmica", "Química Orgânica", "Citologia e Genética"]
  }
];

const ITEMS_PER_PAGE = 5;

export default function GerenciarQuestoesPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("TODAS");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados para o Modal/Modo de Edição
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const saved = JSON.parse(localStorage.getItem("estudos_amor_questions") || "[]");
    setQuestions(saved.reverse());

    const savedFavs = JSON.parse(localStorage.getItem("estudos_amor_favorites") || "[]");
    setFavorites(savedFavs);
  };

  const deleteQuestion = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta questão?")) return;
    
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    localStorage.setItem("estudos_amor_questions", JSON.stringify([...updated].reverse()));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const updatedQuestions = questions.map((q) => 
      q.id === editingQuestion.id ? editingQuestion : q
    );

    setQuestions(updatedQuestions);
    localStorage.setItem("estudos_amor_questions", JSON.stringify([...updatedQuestions].reverse()));
    setEditingQuestion(null);
  };

  // Filtragem
  const filteredQuestions = questions.filter((q) => {
    // Filtro de Favoritas
    if (onlyFavorites) {
      const isFav = favorites.some((f: any) => f.statement === q.statement);
      if (!isFav) return false;
    }

    // Filtro de Busca
    const matchesSearch = q.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.topic.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Filtro de Matéria
    if (selectedSubject === "TODAS") return true;
    return q.subject === selectedSubject;
  });

  // Paginação
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE) || 1;
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Cálculos estatísticos gerais para o topo
  const totalQuestions = questions.length;
  const totalTopics = new Set(questions.map((q) => q.topic)).size;
  const mathCount = questions.filter((q) => q.subject === "Matemática e suas Tecnologias").length;
  const lingCount = questions.filter((q) => q.subject === "Linguagens, Códigos e suas Tecnologias").length;
  const humCount = questions.filter((q) => q.subject === "Ciências Humanas e suas Tecnologias").length;
  const natCount = questions.filter((q) => q.subject === "Ciências da Natureza e suas Tecnologias").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">Gerenciar Questões 🗂️</h1>
          <p className="text-xs text-slate-500 sm:text-sm">Visualize, edite ou remova as questões cadastradas</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/nova-questao"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
          >
            + Nova Questão
          </Link>
        </div>
      </div>

      {/* Cards de Estatísticas Gerais no Topo */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Cadastradas</p>
          <p className="mt-1 text-2xl font-extrabold text-blue-600">{totalQuestions}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assuntos Únicos</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800">{totalTopics}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Matemática & Natureza</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600">{mathCount + natCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Linguagens & Humanas</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-600">{lingCount + humCount}</p>
        </div>
      </div>

      {/* Barra de Filtros, Favoritas e Busca */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Buscar por enunciado ou assunto..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setOnlyFavorites(!onlyFavorites);
              setCurrentPage(1);
            }}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition shadow-sm ${
              onlyFavorites 
                ? 'border-amber-400 bg-amber-50 text-amber-800' 
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            ⭐ Apenas Favoritas
          </button>

          <select
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="TODAS">Todas as Matérias</option>
            <option value="Matemática e suas Tecnologias">Matemática</option>
            <option value="Linguagens, Códigos e suas Tecnologias">Linguagens</option>
            <option value="Ciências Humanas e suas Tecnologias">Humanas</option>
            <option value="Ciências da Natureza e suas Tecnologias">Natureza</option>
          </select>
        </div>
      </div>

      {/* Modal de Edição */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-slate-800">Editar Questão ✍️</h2>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Enunciado</label>
                <textarea
                  rows={3}
                  required
                  className="w-full rounded-xl border p-3 text-sm text-slate-800"
                  value={editingQuestion.statement}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, statement: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Assunto</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border p-2.5 text-sm text-slate-800"
                  value={editingQuestion.topic}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">Alternativas e Gabarito</label>
                {editingQuestion.options.map((opt: any, index: number) => (
                  <div key={opt.letter} className="flex items-center gap-2">
                    <span className="font-bold text-slate-500 text-sm">{opt.letter})</span>
                    <input
                      type="text"
                      required
                      className="flex-1 rounded-xl border p-2 text-sm text-slate-800"
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[index].text = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                    />
                    <input
                      type="radio"
                      name="editCorrectOption"
                      checked={editingQuestion.correctOption === opt.letter}
                      onChange={() => setEditingQuestion({ ...editingQuestion, correctOption: opt.letter })}
                      className="h-4 w-4 accent-emerald-600 cursor-pointer"
                      title="Marcar correta"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-base font-medium text-slate-600 sm:text-lg">Nenhuma questão cadastrada ainda.</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-600">Nenhuma questão encontrada para os filtros aplicados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Exibindo {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredQuestions.length)} de {filteredQuestions.length} questões</span>
            <span>Página {currentPage} de {totalPages}</span>
          </div>
          
          {paginatedQuestions.map((q) => {
            const isFav = favorites.some((f: any) => f.statement === q.statement);

            return (
              <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      {q.subject}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{q.topic}</span>
                    {isFav && <span className="text-xs font-bold text-amber-500">⭐ Favorita</span>}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => setEditingQuestion(q)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 shadow-sm"
                    >
                      Editar ✏️
                    </button>
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 shadow-sm"
                    >
                      Excluir 🗑️
                    </button>
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-800 sm:text-base">{q.statement}</p>

                <div className="space-y-2 text-xs sm:text-sm">
                  {q.options.map((opt: any) => {
                    const isCorrect = opt.letter === q.correctOption;
                    return (
                      <div 
                        key={opt.letter} 
                        className={`rounded-xl border p-2.5 transition ${
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
            );
          })}

          {/* Controles de Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 shadow-sm"
              >
                ← Anterior
              </button>
              
              <span className="px-3 text-xs font-bold text-slate-600">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 shadow-sm"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}