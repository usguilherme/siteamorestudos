"use client";

import { useState } from "react";
import { addQuestion, addQuestions } from "@/lib/store";
import { ENEM_AREAS, topicsFor } from "@/lib/enem";
import type { QuestionOption } from "@/types";
import {
  Badge,
  Button,
  Card,
  Field,
  inputClass,
  selectClass,
} from "@/components/ui";
import { cn } from "@/lib/cn";

const EMPTY_OPTS: QuestionOption[] = [
  { letter: "A", text: "" },
  { letter: "B", text: "" },
  { letter: "C", text: "" },
  { letter: "D", text: "" },
  { letter: "E", text: "" },
];

type Msg = { kind: "ok" | "err" | "info"; text: string } | null;

export default function NovaQuestaoPage() {
  // manual
  const [area, setArea] = useState("");
  const [topic, setTopic] = useState("");
  const [statement, setStatement] = useState("");
  const [options, setOptions] = useState<QuestionOption[]>(EMPTY_OPTS);
  const [correct, setCorrect] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [msg, setMsg] = useState<Msg>(null);

  // pdf + ia
  const [pdfText, setPdfText] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<Msg>(null);

  const topics = area ? topicsFor(area) : [];

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || !topic || !statement.trim()) {
      setMsg({ kind: "err", text: "Preencha área, assunto e enunciado." });
      return;
    }
    if (options.some((o) => !o.text.trim())) {
      setMsg({ kind: "err", text: "Preencha todas as 5 alternativas." });
      return;
    }
    addQuestion({
      subject: area,
      topic,
      statement: statement.trim(),
      options: options.map((o) => ({ ...o, text: o.text.trim() })),
      correctOption: correct,
      explanation: explanation.trim() || undefined,
    });
    setMsg({ kind: "ok", text: "✅ Questão salva!" });
    setStatement("");
    setExplanation("");
    setOptions(EMPTY_OPTS.map((o) => ({ ...o })));
    setCorrect("A");
  };

  const readPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfName(file.name);
    setBusy(true);
    setAiMsg({ kind: "info", text: "Lendo o PDF…" });
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.js");
      if (typeof window !== "undefined") {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      }
      const buf = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buf }).promise;
      let out = "";
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        let lastY: number | null = null;
        let line = "";
        const lines: string[] = [];
        for (const item of content.items) {
          const y = item.transform[5];
          if (lastY !== null && Math.abs(y - lastY) > 2) {
            if (line.trim()) lines.push(line.trim());
            line = "";
          }
          line += item.str + " ";
          lastY = y;
        }
        if (line.trim()) lines.push(line.trim());
        out += `--- Página ${i} ---\n${lines.join("\n")}\n\n`;
      }
      setPdfText(out);
      setAiMsg({ kind: "ok", text: "✅ PDF lido. Agora extraia as questões com a IA." });
    } catch (err) {
      setAiMsg({ kind: "err", text: `❌ Erro ao ler o PDF: ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const extractWithAI = async () => {
    if (!pdfText.trim()) return;
    setBusy(true);
    setAiMsg({ kind: "info", text: "A IA está estruturando as questões…" });
    try {
      const res = await fetch("/api/extrair-questoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pdfText }),
      });
      const data: {
        error?: string;
        questions?: Array<{
          statement?: string;
          options?: Array<{ letter?: string; text?: string }>;
          correctOption?: string;
          explanation?: string;
          possiblyHasImage?: boolean;
        }>;
      } = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na extração.");
      const list = (data.questions ?? []).filter(
        (q) => q.statement && Array.isArray(q.options) && q.options.length >= 2,
      );
      if (!list.length) throw new Error("A IA não encontrou questões estruturáveis nesse texto.");

      addQuestions(
        list.map((q) => ({
          subject: area || "",
          topic: topic || "",
          statement: String(q.statement).trim(),
          options: (q.options ?? []).map((o) => ({
            letter: String(o.letter || "").toUpperCase().slice(0, 1),
            text: String(o.text || "").trim(),
          })),
          correctOption: String(q.correctOption || "").toUpperCase().slice(0, 1),
          explanation: q.explanation ? String(q.explanation).trim() : undefined,
          possiblyHasImage: !!q.possiblyHasImage,
          source: pdfName || undefined,
        })),
      );

      const semArea = !area || !topic;
      setAiMsg({
        kind: "ok",
        text: `✨ ${list.length} questões importadas e salvas${
          semArea ? " — defina área/assunto delas em Gerenciar." : ` em ${area}.`
        }`,
      });
      setPdfText("");
      setPdfName("");
    } catch (err) {
      setAiMsg({ kind: "err", text: `❌ ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Importador de PDF */}
      <Card className="space-y-4 border-primary/30 bg-primary-soft/40 p-5 sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-text">
            🤖 Importar de um PDF <Badge tone="primary">com IA</Badge>
          </h2>
          <p className="mt-1 text-xs text-muted">
            Envie um PDF de prova. O texto é lido no seu navegador e a IA (via Groq)
            organiza as questões. Escolha a área/assunto abaixo pra já classificar tudo.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <select className={selectClass} value={area} onChange={(e) => { setArea(e.target.value); setTopic(""); }}>
            <option value="">Área (opcional)…</option>
            {ENEM_AREAS.map((a) => (
              <option key={a.id} value={a.name}>{a.emoji} {a.short}</option>
            ))}
          </select>
          <select className={selectClass} value={topic} onChange={(e) => setTopic(e.target.value)} disabled={!area}>
            <option value="">Assunto (opcional)…</option>
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className={cn("cursor-pointer", busy && "pointer-events-none opacity-50")}>
            <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg">
              📁 Escolher PDF
            </span>
            <input type="file" accept=".pdf" hidden onChange={readPdf} disabled={busy} />
          </label>
          {pdfName ? <span className="text-xs font-medium text-muted">📄 {pdfName}</span> : null}
        </div>

        <textarea
          rows={4}
          className={inputClass}
          value={pdfText}
          onChange={(e) => setPdfText(e.target.value)}
          placeholder="…ou cole aqui o texto bruto das questões."
        />

        {aiMsg ? <MsgLine msg={aiMsg} /> : null}

        <Button onClick={extractWithAI} disabled={busy || !pdfText.trim()}>
          {busy ? "Processando…" : "Extrair e salvar questões 🚀"}
        </Button>
      </Card>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-faint">
        <div className="h-px flex-1 bg-border" />
        ou cadastro manual
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Formulário manual */}
      <Card className="p-5 sm:p-6">
        <form onSubmit={submitManual} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Área">
              <select className={selectClass} value={area} onChange={(e) => { setArea(e.target.value); setTopic(""); }} required>
                <option value="">Selecione…</option>
                {ENEM_AREAS.map((a) => (
                  <option key={a.id} value={a.name}>{a.short}</option>
                ))}
              </select>
            </Field>
            <Field label="Assunto">
              <select className={selectClass} value={topic} onChange={(e) => setTopic(e.target.value)} required disabled={!area}>
                <option value="">Selecione…</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Enunciado">
            <textarea
              rows={4}
              required
              className={inputClass}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Digite o enunciado…"
            />
          </Field>

          <div>
            <p className="mb-2 text-xs font-semibold text-muted">
              Alternativas <span className="text-faint">(marque a correta)</span>
            </p>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={opt.letter} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrect(opt.letter)}
                    aria-label={`Marcar ${opt.letter} como correta`}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition",
                      correct === opt.letter
                        ? "bg-ok text-white"
                        : "bg-surface-2 text-muted hover:bg-border",
                    )}
                  >
                    {opt.letter}
                  </button>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={opt.text}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = { ...next[i], text: e.target.value };
                      setOptions(next);
                    }}
                    placeholder={`Texto da alternativa ${opt.letter}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <Field label="Resolução / comentário (opcional)">
            <textarea
              rows={2}
              className={inputClass}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Aparece depois que a questão é respondida."
            />
          </Field>

          {msg ? <MsgLine msg={msg} /> : null}

          <Button type="submit" size="lg" className="w-full">
            Salvar questão
          </Button>
        </form>
      </Card>
    </div>
  );
}

function MsgLine({ msg }: { msg: NonNullable<Msg> }) {
  return (
    <p
      className={cn(
        "text-sm font-medium",
        msg.kind === "ok" && "text-ok",
        msg.kind === "err" && "text-bad",
        msg.kind === "info" && "text-primary",
      )}
    >
      {msg.text}
    </p>
  );
}
