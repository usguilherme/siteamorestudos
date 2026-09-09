"use client";

import { useMemo, useState } from "react";
import {
  deleteQuestion,
  updateQuestion,
  useAppData,
  useFavorites,
  useHydrated,
} from "@/lib/store";
import { ENEM_AREAS, areaShort, topicsFor } from "@/lib/enem";
import {
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  type Difficulty,
  type Question,
} from "@/types";
import { cn } from "@/lib/cn";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Field,
  inputClass,
  selectClass,
} from "@/components/ui";

const PAGE_SIZE = 8;

export default function GerenciarQuestoesPage() {
  const hydrated = useHydrated();
  const { questions } = useAppData();
  const [favSet] = useFavorites();
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("TODAS");
  const [onlyFav, setOnlyFav] = useState(false);
  const [needsClass, setNeedsClass] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Question | null>(null);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return [...questions]
      .reverse()
      .filter((q) => {
        if (onlyFav && !favSet.has(q.id)) return false;
        if (needsClass && q.subject && q.topic) return false;
        if (area !== "TODAS" && q.subject !== area) return false;
        if (s && !q.statement.toLowerCase().includes(s) && !q.topic.toLowerCase().includes(s))
          return false;
        return true;
      });
  }, [questions, search, area, onlyFav, needsClass, favSet]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (hydrated && questions.length === 0) {
    return (
      <EmptyState
        icon="📄"
        title="Nenhuma questão cadastrada"
        description="Adicione questões manualmente ou importe um PDF."
        action={<ButtonLink href="/admin/nova-questao">Adicionar questões</ButtonLink>}
      />
    );
  }

  const unclassified = questions.filter((q) => !q.subject || !q.topic).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: questions.length, tone: "text-primary" },
          { label: "Favoritas", value: favSet.size, tone: "text-warn" },
          { label: "Sem classificar", value: unclassified, tone: "text-bad" },
          { label: "Assuntos", value: new Set(questions.map((q) => q.topic).filter(Boolean)).size, tone: "text-text" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">{s.label}</p>
            <p className={cn("mt-1 text-2xl font-extrabold", s.tone)}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar enunciado ou assunto…"
          className="flex-1 rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
        />
        <select className={selectClass + " sm:w-44"} value={area} onChange={(e) => { setArea(e.target.value); setPage(1); }}>
          <option value="TODAS">Todas as áreas</option>
          {ENEM_AREAS.map((a) => <option key={a.id} value={a.name}>{a.short}</option>)}
        </select>
        <div className="flex gap-2">
          <Button variant={onlyFav ? "primary" : "secondary"} size="sm" onClick={() => { setOnlyFav((v) => !v); setPage(1); }}>
            ⭐ Favoritas
          </Button>
          <Button variant={needsClass ? "primary" : "secondary"} size="sm" onClick={() => { setNeedsClass((v) => !v); setPage(1); }}>
            Sem classificar
          </Button>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">Nada encontrado pra esses filtros.</Card>
      ) : (
        <div className="space-y-3">
          {shown.map((q) => (
            <Card key={q.id} className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {q.subject ? <Badge tone="primary">{areaShort(q.subject)}</Badge> : <Badge tone="bad">sem área</Badge>}
                <span className="text-xs text-muted">{q.topic || "sem assunto"}</span>
                {q.year ? <span className="text-xs text-faint">· {q.year}</span> : null}
                {q.difficulty ? (
                  <span className="text-xs text-faint">· {DIFFICULTY_LABEL[q.difficulty]}</span>
                ) : null}
                {favSet.has(q.id) ? <span className="text-xs text-warn">⭐</span> : null}
                {q.correctOption ? null : <Badge tone="warn">sem gabarito</Badge>}
                <div className="ml-auto flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditing(q)}>Editar</Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm("Excluir esta questão?")) deleteQuestion(q.id);
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
              <p className="line-clamp-3 text-sm text-text">{q.statement}</p>
            </Card>
          ))}

          {pageCount > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>←</Button>
              <span className="text-xs font-semibold text-muted">{page} / {pageCount}</span>
              <Button variant="secondary" size="sm" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>→</Button>
            </div>
          ) : null}
        </div>
      )}

      {editing ? (
        <EditModal question={editing} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  );
}

function EditModal({ question, onClose }: { question: Question; onClose: () => void }) {
  const [draft, setDraft] = useState<Question>({
    ...question,
    options:
      question.options.length >= 2
        ? question.options
        : ["A", "B", "C", "D", "E"].map((l) => ({ letter: l, text: "" })),
  });
  const topics = draft.subject ? topicsFor(draft.subject) : [];

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuestion(question.id, {
      subject: draft.subject,
      topic: draft.topic,
      statement: draft.statement.trim(),
      options: draft.options.map((o) => ({ ...o, text: o.text.trim() })),
      correctOption: draft.correctOption,
      explanation: draft.explanation?.trim() || undefined,
      year: draft.year,
      difficulty: draft.difficulty,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
        <h2 className="mb-4 text-lg font-bold text-text">Editar questão ✍️</h2>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Área">
              <select
                className={selectClass}
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value, topic: "" })}
              >
                <option value="">Selecione…</option>
                {ENEM_AREAS.map((a) => <option key={a.id} value={a.name}>{a.short}</option>)}
              </select>
            </Field>
            <Field label="Assunto">
              <select
                className={selectClass}
                value={draft.topic}
                onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
                disabled={!draft.subject}
              >
                <option value="">Selecione…</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Ano">
              <input
                type="number"
                min={2009}
                max={2100}
                className={inputClass}
                value={draft.year ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, year: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            <Field label="Dificuldade">
              <select
                className={selectClass}
                value={draft.difficulty ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    difficulty: (e.target.value || undefined) as Difficulty | undefined,
                  })
                }
              >
                <option value="">—</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABEL[d]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Enunciado">
            <textarea
              rows={3}
              required
              className={inputClass}
              value={draft.statement}
              onChange={(e) => setDraft({ ...draft, statement: e.target.value })}
            />
          </Field>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted">Alternativas e gabarito</p>
            {draft.options.map((opt, i) => (
              <div key={opt.letter} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, correctOption: opt.letter })}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                    draft.correctOption === opt.letter ? "bg-ok text-white" : "bg-surface-2 text-muted",
                  )}
                >
                  {opt.letter}
                </button>
                <input
                  className={inputClass}
                  value={opt.text}
                  onChange={(e) => {
                    const next = [...draft.options];
                    next[i] = { ...next[i], text: e.target.value };
                    setDraft({ ...draft, options: next });
                  }}
                />
              </div>
            ))}
          </div>

          <Field label="Resolução / comentário">
            <textarea
              rows={2}
              className={inputClass}
              value={draft.explanation ?? ""}
              onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
            />
          </Field>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
