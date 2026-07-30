"use client";

import { useState } from "react";
import Link from "next/link";
import { QuestionOption } from "@/types";
import { exportLocalStorageData, importLocalStorageData } from "@/lib/utils";

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

export default function NovaQuestaoPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [statement, setStatement] = useState("");
  const [options, setOptions] = useState<QuestionOption[]>([
    { letter: "A", text: "" },
    { letter: "B", text: "" },
    { letter: "C", text: "" },
    { letter: "D", text: "" },
    { letter: "E", text: "" },
  ]);
  const [correctOption, setCorrectOption] = useState("A");
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Estados de IA e PDF Direto
  const [rawPdfText, setRawPdfText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");

  const currentSubject = ENEM_MATERIAS.find(s => s.id === selectedSubjectId);
  const topics = currentSubject ? currentSubject.topics : [];

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  // Função para ler o arquivo PDF enviado e extrair o texto de forma segura para o browser
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    setIsAiLoading(true);
    setAiMsg("Lendo arquivo PDF...");

    try {
      // Import dinâmico para evitar que o Node.js processe o canvas no SSR
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
      
      if (typeof window !== "undefined") {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      
      let extractedText = "";
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        extractedText += `--- Página ${i} ---\n` + pageText + "\n\n";
      }

      setRawPdfText(extractedText);
      setAiMsg("✅ PDF lido com sucesso! Clique em 'Extrair com IA' para estruturar as questões.");
    } catch (error: any) {
      setAiMsg(`❌ Erro ao ler PDF: ${error.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiExtraction = async () => {
    if (!rawPdfText.trim()) return;

    setIsAiLoading(true);
    setAiMsg("A IA está analisando e estruturando as questões...");

    try {
      const response = await fetch("/api/extrair-questoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawPdfText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar com IA.");
      }

      if (data.questions && Array.isArray(data.questions)) {
        const existingQuestions = JSON.parse(localStorage.getItem("estudos_amor_questions") || "[]");
        
        const formattedNewQuestions = data.questions.map((q: any, idx: number) => ({
          ...q,
          id: `${Date.now()}-${idx}`,
          createdAt: new Date().toISOString()
        }));

        const updatedQuestions = [...existingQuestions, ...formattedNewQuestions];
        localStorage.setItem("estudos_amor_questions", JSON.stringify(updatedQuestions));

        setAiMsg(`✨ Sucesso! ${formattedNewQuestions.length} questões foram extraídas do PDF e salvas automaticamente.`);
        setRawPdfText("");
        setPdfFileName("");
      } else {
        throw new Error("Formato de retorno inválido da IA.");
      }
    } catch (error: any) {
      setAiMsg(`❌ Erro na extração: ${error.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedTopic || !statement) return;
    
    setLoading(true);
    setMsg("");

    try {
      const subjectName = currentSubject?.name || "";
      const newQuestion = {
        id: Date.now().toString(),
        subject: subjectName,
        topic: selectedTopic,
        statement,
        options,
        correctOption,
        createdAt: new Date().toISOString(),
      };

      const existingQuestions = JSON.parse(localStorage.getItem("estudos_amor_questions") || "[]");
      localStorage.setItem("estudos_amor_questions", JSON.stringify([...existingQuestions, newQuestion]));

      setMsg("✅ Questão salva com sucesso localmente!");
      setStatement("");
      setOptions(options.map(o => ({ ...o, text: "" })));
    } catch (error: any) {
      setMsg(`❌ Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Cadastrar Nova Questão 📝</h1>
        
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/questoes"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 shadow-sm"
          >
            Ver Questões 🗂️
          </Link>

          <button
            onClick={exportLocalStorageData}
            type="button"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm"
          >
            Exportar 💾
          </button>

          <label className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm">
            Importar 📂
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                importLocalStorageData(e, () => {
                  alert("✅ Backup restaurado com sucesso! A página será recarregada.");
                  window.location.reload();
                });
              }}
            />
          </label>
        </div>
      </div>

      {/* Caixa de Importação Direta via PDF & IA */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-blue-50/60 p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">🤖 Importador Automático de PDF com IA</h2>
          <p className="text-xs text-slate-500 mt-1">
            Envie o arquivo PDF com as questões. O sistema lerá o documento e a IA organizará tudo automaticamente em seu banco de dados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 shadow-sm">
            📁 Enviar Arquivo PDF
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handlePdfUpload}
            />
          </label>
          {pdfFileName && (
            <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-2.5 rounded-xl truncate">
              📄 {pdfFileName}
            </span>
          )}
        </div>

        <textarea
          rows={4}
          className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 bg-white"
          value={rawPdfText}
          onChange={(e) => setRawPdfText(e.target.value)}
          placeholder="Ou cole o texto bruto do PDF aqui se preferir..."
        />

        {aiMsg && (
          <p className={`text-xs sm:text-sm font-medium ${aiMsg.includes("Sucesso") || aiMsg.includes("sucesso") ? "text-emerald-600" : aiMsg.includes("Erro") ? "text-red-600" : "text-indigo-600"}`}>
            {aiMsg}
          </p>
        )}

        <button
          type="button"
          disabled={isAiLoading || !rawPdfText.trim()}
          onClick={handleAiExtraction}
          className="w-full sm:w-auto rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
        >
          {isAiLoading ? "Processando com IA..." : "Extrair e Cadastrar Questões com IA 🚀"}
        </button>
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-xs font-semibold uppercase tracking-wider text-slate-400">ou cadastro manual</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* Formulário de Cadastro Manual */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">Matéria</label>
            <select 
              className="w-full rounded-xl border p-2.5 text-sm text-slate-800 bg-white shadow-sm"
              value={selectedSubjectId} 
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedTopic("");
              }}
              required
            >
              <option value="">Selecione...</option>
              {ENEM_MATERIAS.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">Assunto</label>
            <select 
              className="w-full rounded-xl border p-2.5 text-sm text-slate-800 bg-white shadow-sm"
              value={selectedTopic} 
              onChange={(e) => setSelectedTopic(e.target.value)}
              required
              disabled={!selectedSubjectId}
            >
              <option value="">Selecione...</option>
              {topics.map((top) => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-700">Enunciado</label>
          <textarea
            required
            rows={4}
            className="w-full rounded-xl border p-3 text-sm text-slate-800 shadow-sm"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Digite o enunciado da questão..."
          />
        </div>

        <div>
          <label className="mb-4 block text-xs font-semibold text-slate-700">Alternativas</label>
          <div className="space-y-3">
            {options.map((opt, index) => (
              <div key={opt.letter} className="flex items-center gap-3">
                <span className="font-bold text-slate-500">{opt.letter})</span>
                <input
                  type="text"
                  required
                  className="flex-1 rounded-xl border p-2.5 text-sm text-slate-800 shadow-sm"
                  value={opt.text}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Texto da alternativa ${opt.letter}`}
                />
                <input
                  type="radio"
                  name="correctOption"
                  value={opt.letter}
                  checked={correctOption === opt.letter}
                  onChange={(e) => setCorrectOption(e.target.value)}
                  className="h-5 w-5 cursor-pointer accent-emerald-500"
                  title="Marcar como correta"
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Selecione a bolinha da alternativa que é a correta.</p>
        </div>

        {msg && <p className={`text-sm font-medium ${msg.includes("sucesso") ? "text-emerald-600" : "text-red-600"}`}>{msg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
        >
          {loading ? "Salvando..." : "Salvar Questão"}
        </button>
      </form>
    </div>
  );
}