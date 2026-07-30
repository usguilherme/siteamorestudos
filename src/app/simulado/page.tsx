"use client";

import { useEffect, useState } from "react";

const ENEM_MATERIAS_COM_TOPICOS = [
  {
    id: "Matemática e suas Tecnologias",
    name: "Matemática e suas Tecnologias",
    topics: ["Aritmética e Operações Básicas", "Razão, Proporção e Regra de Três", "Porcentagem e Matemática Financeira", "Geometria Plana", "Funções"]
  },
  {
    id: "Linguagens, Códigos e suas Tecnologias",
    name: "Linguagens, Códigos e suas Tecnologias",
    topics: ["Interpretação e Compreensão de Textos", "Funções da Linguagem", "Variação Linguística", "Literatura Brasileira"]
  },
  {
    id: "Ciências Humanas e suas Tecnologias",
    name: "Ciências Humanas e suas Tecnologias",
    topics: ["História do Brasil", "História Geral", "Geografia Física e Cartografia", "Sociologia e Filosofia"]
  },
  {
    id: "Ciências da Natureza e suas Tecnologias",
    name: "Ciências da Natureza e suas Tecnologias",
    topics: ["Mecânica", "Termologia", "Eletrodinâmica", "Química Orgânica", "Citologia e Genética"]
  }
];

const ERROR_REASONS = [
  "Não sabia o conteúdo",
  "Errei o cálculo",
  "Não entendi a questão",
  "Falta de atenção",
  "Chutei"
];

export default function SimuladoPage() {
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("TODAS");
  const [selectedTopic, setSelectedTopic] = useState("TODOS");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [favorites, setFavorites] = useState<any[]>([]);
  
  // Estado para o motivo do erro selecionado
  const [selectedErrorReason, setSelectedErrorReason] = useState<string>("");

  // Estados do Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("estudos_amor_questions") || "[]");
    setAllQuestions(saved);
    setQuestions(saved);

    const savedFavs = JSON.parse(localStorage.getItem("estudos_amor_favorites") || "[]");
    setFavorites(savedFavs);
  }, []);

  // Timer do Simulado
  useEffect(() => {
    if (questions.length === 0 || isFinished) return;
    
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [questions.length, isFinished]);

  const formatTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleFilterChange = (subject: string, topic: string) => {
    setSelectedSubject(subject);
    setSelectedTopic(topic);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setSelectedErrorReason("");
    setScore(0);
    setSecondsElapsed(0);
    setIsFinished(false);

    let filtered = allQuestions;

    if (subject !== "TODAS") {
      filtered = filtered.filter((q) => q.subject === subject);
    }

    if (topic !== "TODOS") {
      filtered = filtered.filter((q) => q.topic === topic);
    }

    setQuestions(filtered);
  };

  const currentSubjectObj = ENEM_MATERIAS_COM_TOPICOS.find((s) => s.id === selectedSubject);
  const availableTopics = currentSubjectObj ? currentSubjectObj.topics : [];

  if (allQuestions.length === 0) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-slate-800">Simulado 📝</h1>
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
          Nenhuma questão encontrada. Cadastre questões no painel Admin ou use a importação por IA para iniciar o simulado!
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Matéria</label>
            <select
              className="w-full rounded-xl border p-2.5 text-xs font-semibold text-slate-800 bg-white shadow-sm"
              value={selectedSubject}
              onChange={(e) => handleFilterChange(e.target.value, "TODOS")}
            >
              <option value="TODAS">Todas as Matérias</option>
              {ENEM_MATERIAS_COM_TOPICOS.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Tópico / Assunto</label>
            <select
              className="w-full rounded-xl border p-2.5 text-xs font-semibold text-slate-800 bg-white shadow-sm"
              value={selectedTopic}
              onChange={(e) => handleFilterChange(selectedSubject, e.target.value)}
              disabled={selectedSubject === "TODAS"}
            >
              <option value="TODOS">Todos os Assuntos</option>
              {availableTopics.map((top) => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          Nenhuma questão cadastrada para este filtro ainda.
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isCurrentFavorite = favorites.some((f: any) => f.statement === currentQ.statement);

  const toggleFavorite = () => {
    let updatedFavs;
    if (isCurrentFavorite) {
      updatedFavs = favorites.filter((f: any) => f.statement !== currentQ.statement);
    } else {
      const qWithId = { ...currentQ, id: currentQ.id || Date.now().toString() };
      updatedFavs = [...favorites, qWithId];
    }
    setFavorites(updatedFavs);
    localStorage.setItem("estudos_amor_favorites", JSON.stringify(updatedFavs));
  };

  const handleAnswer = (letter: string) => {
    if (isAnswered) return;
    setSelectedOption(letter);
    setIsAnswered(true);

    const isCorrect = letter === currentQ.correctOption;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    const historyItem = {
      statement: currentQ.statement,
      subject: currentQ.subject,
      topic: currentQ.topic,
      isCorrect,
      selected: letter,
      correct: currentQ.correctOption,
      errorReason: null, // Será preenchido caso o usuário escolha o motivo
      date: new Date().toISOString(),
    };

    const existingHistory = JSON.parse(localStorage.getItem("estudos_amor_history") || "[]");
    localStorage.setItem("estudos_amor_history", JSON.stringify([...existingHistory, historyItem]));
  };

  const handleSelectErrorReason = (reason: string) => {
    setSelectedErrorReason(reason);
    
    // Atualiza o último item salvo no histórico com o motivo do erro selecionado
    const existingHistory = JSON.parse(localStorage.getItem("estudos_amor_history") || "[]");
    if (existingHistory.length > 0) {
      existingHistory[existingHistory.length - 1].errorReason = reason;
      localStorage.setItem("estudos_amor_history", JSON.stringify(existingHistory));
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setSelectedErrorReason("");
    if (currentIndex + 1 >= questions.length) {
      setIsFinished(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setSelectedErrorReason("");
    setScore(0);
    setSecondsElapsed(0);
    setIsFinished(false);
  };

  if (isFinished || currentIndex >= questions.length) {
    return (
      <div className="mx-auto max-w-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Matéria</label>
            <select
              className="w-full rounded-xl border p-2.5 text-xs font-semibold text-slate-800 bg-white shadow-sm"
              value={selectedSubject}
              onChange={(e) => handleFilterChange(e.target.value, "TODAS")}
            >
              <option value="TODAS">Todas as Matérias</option>
              {ENEM_MATERIAS_COM_TOPICOS.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Tópico / Assunto</label>
            <select
              className="w-full rounded-xl border p-2.5 text-xs font-semibold text-slate-800 bg-white shadow-sm"
              value={selectedTopic}
              onChange={(e) => handleFilterChange(selectedSubject, e.target.value)}
              disabled={selectedSubject === "TODAS"}
            >
              <option value="TODOS">Todos os Assuntos</option>
              {availableTopics.map((top) => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-slate-800">Simulado Concluído! 🎉</h1>
          <p className="mb-6 text-slate-500">Você finalizou todas as questões desta seleção.</p>
          
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-900">
              <p className="text-xs font-semibold uppercase tracking-wider">Pontuação</p>
              <p className="mt-1 text-2xl font-extrabold">{score} / {questions.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tempo Total</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-800">{formatTimer(secondsElapsed)}</p>
            </div>
          </div>

          <button
            onClick={restartQuiz}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 shadow-sm"
          >
            Refazer Simulado
          </button>
        </div>
      </div>
    );
  }

  const isCurrentIncorrect = isAnswered && selectedOption !== currentQ.correctOption;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Filtrar por Matéria</label>
          <select
            className="w-full rounded-xl border p-2.5 text-xs font-semibold text-slate-800 bg-white shadow-sm"
            value={selectedSubject}
            onChange={(e) => handleFilterChange(e.target.value, "TODAS")}
          >
            <option value="TODAS">Todas as Matérias</option>
            {ENEM_MATERIAS_COM_TOPICOS.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Filtrar por Assunto</label>
          <select
            className="w-full rounded-xl border p-2.5 text-xs font-semibold text-slate-800 bg-white shadow-sm"
            value={selectedTopic}
            onChange={(e) => handleFilterChange(selectedSubject, e.target.value)}
            disabled={selectedSubject === "TODAS"}
          >
            <option value="TODOS">Todos os Assuntos</option>
            {availableTopics.map((top) => (
              <option key={top} value={top}>{top}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            {currentQ.subject}
          </span>
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition ${
              isCurrentFavorite 
                ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm' 
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            {isCurrentFavorite ? "⭐ Favoritada" : "☆ Favoritar"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
            ⏱️ {formatTimer(secondsElapsed)}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {currentIndex + 1} de {questions.length}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold text-blue-600 uppercase tracking-wide">{currentQ.topic}</p>
          <p className="text-base font-medium text-slate-800 sm:text-lg">{currentQ.statement}</p>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((opt: any) => {
            let style = "border-slate-200 bg-white text-slate-700 hover:border-blue-300";
            
            if (isAnswered) {
              if (opt.letter === currentQ.correctOption) {
                style = "border-emerald-500 bg-emerald-50 font-semibold text-emerald-900 shadow-sm";
              } else if (opt.letter === selectedOption) {
                style = "border-red-400 bg-red-50 text-red-900";
              } else {
                style = "border-slate-200 bg-white opacity-50 text-slate-500";
              }
            }

            return (
              <button
                key={opt.letter}
                disabled={isAnswered}
                onClick={() => handleAnswer(opt.letter)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition text-sm sm:text-base ${style}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700 shrink-0">
                  {opt.letter}
                </span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <p className={`font-semibold text-sm ${selectedOption === currentQ.correctOption ? 'text-emerald-600' : 'text-red-600'}`}>
              {selectedOption === currentQ.correctOption ? "✅ Resposta Correta!" : "❌ Resposta Incorreta."}
            </p>

            {/* Se errou, exibe o seletor de motivos do erro */}
            {isCurrentIncorrect && (
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 space-y-2">
                <p className="text-xs font-bold text-red-900 uppercase tracking-wide">Por que você errou esta questão?</p>
                <div className="flex flex-wrap gap-2">
                  {ERROR_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => handleSelectErrorReason(reason)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition shadow-sm ${
                        selectedErrorReason === reason 
                          ? 'border-red-600 bg-red-600 text-white' 
                          : 'border-red-200 bg-white text-red-700 hover:bg-red-50'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={nextQuestion}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm"
              >
                Próxima Questão ➔
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}