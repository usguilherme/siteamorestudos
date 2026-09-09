"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  markReviewed,
  recordAttempt,
  saveSession,
  toggleFavorite,
  useAppData,
} from "@/lib/store";
import { ENEM_AREAS, areaShort, getArea, topicsFor } from "@/lib/enem";
import {
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  ERROR_REASONS,
  type Difficulty,
  type ErrorReason,
  type Question,
  type QuestionSource,
  type SimuladoMode,
} from "@/types";
import { computeScoreEstimate } from "@/lib/stats";
import { messages } from "@/lib/messages";
import { formatTime } from "@/lib/utils";
import { shuffle } from "@/lib/shuffle";
import { cn } from "@/lib/cn";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Field,
  ProgressBar,
  selectClass,
} from "@/components/ui";

type Phase = "setup" | "running" | "done";

const SOURCE_LABELS: Record<QuestionSource, string> = {
  todas: "Todas as questões",
  erradas: "Só as que eu errei",
  "nao-vistas": "Questões inéditas",
  favoritas: "Minhas favoritas",
};

const LETTERS = ["A", "B", "C", "D", "E"];

// Prova real: 90 questões, 5h30 de cronômetro (1º dia do ENEM).
const PROVA_REAL_COUNT = 90;
const PROVA_REAL_SECONDS = 5 * 3600 + 30 * 60;
const AREA_ORDER = ["linguagens", "humanas", "natureza", "matematica"];

function usable(q: Question) {
  return q.options.length >= 2 && !!q.correctOption;
}

export function SimuladoApp() {
  const params = useSearchParams();
  const { questions, attempts, favorites } = useAppData();

  const favSet = useMemo(() => new Set(favorites), [favorites]);

  const { wrongIds, seenIds } = useMemo(() => {
    const last = new Map<string, boolean>();
    const seen = new Set<string>();
    for (const a of [...attempts].sort((x, y) => x.createdAt.localeCompare(y.createdAt))) {
      if (!a.questionId) continue;
      seen.add(a.questionId);
      last.set(a.questionId, a.isCorrect);
    }
    const wrong = new Set<string>();
    for (const [id, ok] of last) if (!ok) wrong.add(id);
    return { wrongIds: wrong, seenIds: seen };
  }, [attempts]);

  const [phase, setPhase] = useState<Phase>("setup");

  // config
  const [area, setArea] = useState(params.get("area") || "TODAS");
  const [topic, setTopic] = useState(params.get("topic") || "TODOS");
  const [count, setCount] = useState(10);
  const [shuffleQ, setShuffleQ] = useState(true);
  const [mode, setMode] = useState<SimuladoMode>(
    (params.get("mode") as SimuladoMode) || "treino",
  );
  const [source, setSource] = useState<QuestionSource>(
    (params.get("source") as QuestionSource) || "todas",
  );
  const [yearFilter, setYearFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState<Difficulty | "">("");

  const availableYears = useMemo(
    () =>
      [...new Set(questions.map((q) => q.year).filter((y): y is number => !!y))].sort(
        (a, b) => b - a,
      ),
    [questions],
  );

  // sessão
  const [pool, setPool] = useState<Question[]>([]);
  const [runMode, setRunMode] = useState<SimuladoMode>("treino");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, ErrorReason>>({});
  const [elapsed, setElapsed] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const startedRef = useRef(0);

  const areaTopics = area !== "TODAS" ? topicsFor(area) : [];

  const buildPool = useCallback((): Question[] => {
    let list = questions.filter(usable);

    if (mode === "prova-real") {
      list = shuffle(list).slice(0, PROVA_REAL_COUNT);
      const rank = (q: Question) => {
        const i = AREA_ORDER.indexOf(getArea(q.subject)?.id ?? "");
        return i < 0 ? 99 : i;
      };
      return [...list].sort((a, b) => rank(a) - rank(b));
    }

    if (area !== "TODAS") list = list.filter((q) => q.subject === area);
    if (topic !== "TODOS") list = list.filter((q) => q.topic === topic);
    if (yearFilter) list = list.filter((q) => String(q.year) === yearFilter);
    if (diffFilter) list = list.filter((q) => q.difficulty === diffFilter);
    if (source === "erradas") list = list.filter((q) => wrongIds.has(q.id));
    if (source === "nao-vistas") list = list.filter((q) => !seenIds.has(q.id));
    if (source === "favoritas") list = list.filter((q) => favSet.has(q.id));
    if (shuffleQ) list = shuffle(list);
    else list = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return list.slice(0, Math.max(1, count));
  }, [questions, mode, area, topic, yearFilter, diffFilter, source, shuffleQ, count, wrongIds, seenIds, favSet]);

  const preview = useMemo(() => buildPool().length, [buildPool]);
  const totalUsable = useMemo(
    () => questions.filter(usable).length,
    [questions],
  );

  const start = useCallback(
    (customPool?: Question[], modeOverride?: SimuladoMode) => {
      const next = customPool ?? buildPool();
      if (!next.length) return;
      setPool(next);
      setRunMode(modeOverride ?? mode);
      setIdx(0);
      setAnswers({});
      setReasons({});
      setElapsed({});
      setFlagged(new Set());
      startedRef.current = Date.now();
      setPhase("running");
      window.scrollTo({ top: 0 });
    },
    [buildPool, mode],
  );

  // auto-start via query param
  const autoRef = useRef(false);
  useEffect(() => {
    if (autoRef.current) return;
    if (params.get("auto") === "1" && questions.length) {
      autoRef.current = true;
      // bootstrap único a partir do parâmetro ?auto=1 da URL
      // eslint-disable-next-line react-hooks/set-state-in-effect
      start();
    }
  }, [params, questions.length, start]);

  const current = pool[idx];
  const answered = current ? answers[current.id] !== undefined : false;
  const lockedTreino = runMode === "treino" && answered;
  const isExam = runMode !== "treino";
  const isProvaReal = runMode === "prova-real";

  // cronômetro por questão
  useEffect(() => {
    if (phase !== "running" || !current) return;
    if (lockedTreino) return;
    const id = current.id;
    const t = setInterval(() => {
      setElapsed((e) => ({ ...e, [id]: (e[id] ?? 0) + 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [phase, current, lockedTreino]);

  const totalElapsed = useMemo(
    () => Object.values(elapsed).reduce((s, n) => s + n, 0),
    [elapsed],
  );
  const remaining = PROVA_REAL_SECONDS - totalElapsed;

  const answer = useCallback(
    (letter: string) => {
      if (!current) return;
      if (runMode === "treino" && answers[current.id] !== undefined) return;
      setAnswers((a) => ({ ...a, [current.id]: letter }));
    },
    [current, runMode, answers],
  );

  const goto = useCallback(
    (n: number) => {
      setIdx(Math.max(0, Math.min(pool.length - 1, n)));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [pool.length],
  );

  const finish = useCallback(() => {
    let correct = 0;
    let answeredCount = 0;
    for (const q of pool) {
      const letter = answers[q.id];
      if (letter === undefined) continue;
      answeredCount++;
      const isCorrect = letter === q.correctOption;
      if (isCorrect) correct++;
      recordAttempt({
        questionId: q.id,
        statement: q.statement,
        subject: q.subject,
        topic: q.topic,
        isCorrect,
        userAnswer: letter,
        correctAnswer: q.correctOption,
        reason: reasons[q.id] ?? null,
        difficulty: q.difficulty,
        timeSpent: elapsed[q.id] ?? 0,
        mode: runMode,
      });
      if (source === "erradas" || source === "favoritas") markReviewed(q.id);
    }

    const sessionAttempts = pool
      .filter((q) => answers[q.id] !== undefined)
      .map((q) => ({
        subject: q.subject,
        isCorrect: answers[q.id] === q.correctOption,
        difficulty: q.difficulty,
      }));
    const est = computeScoreEstimate(sessionAttempts as never);

    saveSession({
      mode: runMode,
      subject: runMode === "prova-real" ? "TODAS" : area,
      topic: runMode === "prova-real" ? "TODOS" : topic,
      questionSource: source,
      total: answeredCount,
      correct,
      timeSpent: totalElapsed,
      estimatedScore: est.overall ?? undefined,
    });
    setPhase("done");
    window.scrollTo({ top: 0 });
  }, [pool, answers, reasons, elapsed, runMode, area, topic, source, totalElapsed]);

  // Prova real: acabou o tempo → encerra automaticamente.
  useEffect(() => {
    if (phase === "running" && isProvaReal && remaining <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      finish();
    }
  }, [phase, isProvaReal, remaining, finish]);

  // atalhos de teclado
  useEffect(() => {
    if (phase !== "running" || !current) return;
    const handler = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      const k = e.key.toLowerCase();
      const letterIdx = LETTERS.indexOf(k.toUpperCase());
      if (letterIdx >= 0 && current.options[letterIdx]) {
        answer(current.options[letterIdx].letter);
      } else if (k === "n" || k === "arrowright" || k === "enter") {
        if (idx < pool.length - 1) goto(idx + 1);
        else if (runMode !== "treino") finish();
        else if (answered) finish();
      } else if (k === "p" || k === "arrowleft") {
        goto(idx - 1);
      } else if (k === "f") {
        toggleFavorite(current.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, current, idx, pool.length, runMode, answered, answer, goto, finish]);

  /* ----------------------------- SETUP ----------------------------- */
  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
            Montar simulado 📝
          </h1>
          <p className="mt-1 text-sm text-muted">
            Escolha o foco da sessão. Você pode usar o teclado (A–E, N, P, F) durante a prova.
          </p>
        </div>

        {totalUsable === 0 ? (
          <EmptyState
            icon="📄"
            title="Nenhuma questão disponível"
            description="Cadastre questões ou importe um PDF de prova pra começar a treinar."
            action={<ButtonLink href="/admin/nova-questao">Adicionar questões</ButtonLink>}
          />
        ) : (
          <Card className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted">Modo</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["treino", "Treino", "Vê a resposta na hora"],
                    ["prova", "Prova", "Resultado só no fim"],
                    ["prova-real", "Prova real", "90 questões · 5h30"],
                  ] as const
                ).map(([v, title, desc]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMode(v)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition",
                      mode === v
                        ? "border-primary bg-primary-soft"
                        : "border-border-strong bg-surface hover:bg-surface-2",
                    )}
                  >
                    <p className="text-sm font-bold text-text">{title}</p>
                    <p className="text-xs text-muted">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {mode === "prova-real" ? (
              <div className="rounded-xl border border-primary/30 bg-primary-soft/50 p-4 text-sm text-muted">
                Simulado no formato do 1º dia: <strong className="text-text">90 questões</strong> de
                todas as áreas na ordem oficial, cronômetro regressivo de{" "}
                <strong className="text-text">5h30</strong>, gabarito só no fim. Treinar
                resistência é metade da prova.
                {totalUsable < PROVA_REAL_COUNT ? (
                  <p className="mt-2 text-warn">
                    Você tem {totalUsable} questões — a prova real vai usar todas elas.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className={cn("grid gap-4 sm:grid-cols-2", mode === "prova-real" && "hidden")}>
              <Field label="Área">
                <select
                  className={selectClass}
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    setTopic("TODOS");
                  }}
                >
                  <option value="TODAS">Todas as áreas</option>
                  {ENEM_AREAS.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.emoji} {a.short}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Assunto">
                <select
                  className={selectClass}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={area === "TODAS"}
                >
                  <option value="TODOS">Todos os assuntos</option>
                  {areaTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fonte das questões">
                <select
                  className={selectClass}
                  value={source}
                  onChange={(e) => setSource(e.target.value as QuestionSource)}
                >
                  {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Quantidade de questões">
                <select
                  className={selectClass}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  {[5, 10, 15, 20, 30, 45, 90].map((n) => (
                    <option key={n} value={n}>
                      {n} questões
                    </option>
                  ))}
                </select>
              </Field>

              {availableYears.length > 0 ? (
                <Field label="Ano">
                  <select
                    className={selectClass}
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    <option value="">Qualquer ano</option>
                    {availableYears.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}

              <Field label="Dificuldade">
                <select
                  className={selectClass}
                  value={diffFilter}
                  onChange={(e) => setDiffFilter(e.target.value as Difficulty | "")}
                >
                  <option value="">Qualquer nível</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {DIFFICULTY_LABEL[d]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {mode !== "prova-real" ? (
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={shuffleQ}
                  onChange={(e) => setShuffleQ(e.target.checked)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="font-medium text-text">Embaralhar a ordem das questões</span>
              </label>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                {preview > 0 ? (
                  <>
                    <span className="font-bold text-text">{preview}</span> questão(ões)
                  </>
                ) : (
                  "Nenhuma questão com esse filtro."
                )}
              </p>
              <Button size="lg" disabled={preview === 0} onClick={() => start()}>
                {mode === "prova-real"
                  ? "Iniciar prova real 🕐"
                  : `Começar ${mode === "prova" ? "prova" : "treino"} 🚀`}
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  /* ----------------------------- DONE ------------------------------ */
  if (phase === "done") {
    const done = pool.filter((q) => answers[q.id] !== undefined);
    const correct = done.filter((q) => answers[q.id] === q.correctOption);
    const wrong = done.filter((q) => answers[q.id] !== q.correctOption);
    const acc = done.length ? Math.round((correct.length / done.length) * 100) : 0;

    const byTopic = new Map<string, { total: number; correct: number }>();
    for (const q of done) {
      const cur = byTopic.get(q.topic) ?? { total: 0, correct: 0 };
      cur.total++;
      if (answers[q.id] === q.correctOption) cur.correct++;
      byTopic.set(q.topic, cur);
    }

    const est = computeScoreEstimate(
      done.map((q) => ({
        subject: q.subject,
        isCorrect: answers[q.id] === q.correctOption,
        difficulty: q.difficulty,
      })) as never,
    );

    return (
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6">
        <Card className="p-6 text-center sm:p-8">
          <p className="text-5xl">{acc >= 75 ? "🌟" : acc >= 50 ? "💪" : "🤍"}</p>
          <h1 className="mt-2 text-2xl font-extrabold text-text">Simulado concluído!</h1>
          <p className="mt-1 text-muted">
            <NameAware fallback="Bom trabalho!" render={(n) => messages.session(n, acc)} />
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">Acerto</p>
              <p className="mt-1 text-2xl font-extrabold text-primary">{acc}%</p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">Placar</p>
              <p className="mt-1 text-2xl font-extrabold text-text">
                {correct.length}<span className="text-base font-semibold text-muted">/{done.length}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">Tempo</p>
              <p className="mt-1 text-2xl font-extrabold text-text">{formatTime(totalElapsed)}</p>
            </div>
          </div>

          {est.overall !== null ? (
            <p className="mt-4 text-sm text-muted">
              Nota estimada nesta sessão:{" "}
              <strong className="text-text">{est.overall}</strong>{" "}
              <span className="text-faint">(heurística por dificuldade — não é a TRI oficial)</span>
            </p>
          ) : null}
        </Card>

        {byTopic.size > 0 ? (
          <Card className="space-y-3 p-5">
            <h2 className="text-sm font-bold text-text">Desempenho por assunto</h2>
            {[...byTopic.entries()]
              .sort(([, a], [, b]) => a.correct / a.total - b.correct / b.total)
              .map(([t, v]) => {
                const p = Math.round((v.correct / v.total) * 100);
                return (
                  <div key={t}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-text">{t}</span>
                      <span className="text-muted">
                        {v.correct}/{v.total} · {p}%
                      </span>
                    </div>
                    <ProgressBar value={p} tone={p >= 70 ? "ok" : p >= 40 ? "primary" : "warn"} />
                  </div>
                );
              })}
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {wrong.length > 0 ? (
            <Button onClick={() => start(shuffle(wrong), "treino")}>
              Revisar os {wrong.length} erro(s) agora
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => setPhase("setup")}>
            Novo simulado
          </Button>
          <ButtonLink href="/desempenho" variant="ghost">
            Ver desempenho →
          </ButtonLink>
        </div>

        {/* Revisão detalhada */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-text">Revisão das questões</h2>
          {pool.map((q, i) => {
            const picked = answers[q.id];
            const ok = picked === q.correctOption;
            return (
              <Card key={q.id} className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone={picked === undefined ? "neutral" : ok ? "ok" : "bad"}>
                    {picked === undefined ? "em branco" : ok ? "✅ acertou" : "❌ errou"}
                  </Badge>
                  <span className="text-xs text-muted">
                    {i + 1}. {areaShort(q.subject)} · {q.topic}
                  </span>
                </div>
                <p className="text-sm text-text">{q.statement}</p>
                <div className="mt-2 space-y-1 text-sm">
                  {q.options.map((o) => (
                    <div key={o.letter}>
                      <div
                        className={cn(
                          "rounded-lg px-2 py-1",
                          o.letter === q.correctOption && "bg-[var(--ok-soft)] font-semibold text-ok",
                          o.letter === picked && !ok && "bg-[var(--bad-soft)] text-bad line-through",
                        )}
                      >
                        <span className="font-bold">{o.letter})</span> {o.text}
                      </div>
                      {q.optionComments?.[o.letter] ? (
                        <p className="px-2 pt-0.5 text-xs text-muted">
                          {o.letter === q.correctOption ? "✓ " : "✗ "}
                          {q.optionComments[o.letter]}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
                {q.explanation ? (
                  <p className="mt-2 rounded-lg bg-surface-2 p-2 text-xs text-muted">
                    💡 {q.explanation}
                  </p>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  /* --------------------------- RUNNING ----------------------------- */
  if (!current) return null;
  const progress = ((idx + (answered ? 1 : 0)) / pool.length) * 100;
  const isFav = favSet.has(current.id);
  const isWrong = runMode === "treino" && answered && answers[current.id] !== current.correctOption;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* barra superior */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted">
          <span>
            Questão {idx + 1} de {pool.length}
          </span>
          <span className="flex items-center gap-3">
            <span className="tabular-nums">⏱️ {formatTime(elapsed[current.id] ?? 0)}</span>
            {isProvaReal ? (
              <span
                className={cn(
                  "tabular-nums font-bold",
                  remaining < 600 ? "text-bad" : "text-primary",
                )}
              >
                ⏳ {formatTime(Math.max(0, remaining))}
              </span>
            ) : (
              <span className="tabular-nums text-faint">Σ {formatTime(totalElapsed)}</span>
            )}
          </span>
        </div>
        <ProgressBar value={progress} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone="primary">{areaShort(current.subject)}</Badge>
        <Badge>{current.topic}</Badge>
        {current.year ? <Badge tone="neutral">{current.year}</Badge> : null}
        {current.difficulty && runMode === "treino" && answered ? (
          <Badge
            tone={
              current.difficulty === "facil"
                ? "ok"
                : current.difficulty === "dificil"
                  ? "bad"
                  : "warn"
            }
          >
            {DIFFICULTY_LABEL[current.difficulty]}
          </Badge>
        ) : null}
        <button
          onClick={() => toggleFavorite(current.id)}
          className={cn(
            "ml-auto rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
            isFav
              ? "border-[var(--warn)]/40 bg-[var(--warn-soft)] text-warn"
              : "border-border-strong text-muted hover:bg-surface-2",
          )}
        >
          {isFav ? "⭐ favoritada" : "☆ favoritar"}
        </button>
        <button
          onClick={() =>
            setFlagged((f) => {
              const n = new Set(f);
              if (n.has(current.id)) n.delete(current.id);
              else n.add(current.id);
              return n;
            })
          }
          className={cn(
            "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
            flagged.has(current.id)
              ? "border-accent/40 bg-accent-soft text-accent"
              : "border-border-strong text-muted hover:bg-surface-2",
          )}
        >
          🚩 marcar
        </button>
      </div>

      <Card className="space-y-5 p-4 sm:p-6">
        {current.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.imageUrl}
            alt="Imagem da questão"
            className="mx-auto max-h-72 rounded-xl border border-border object-contain"
          />
        ) : null}
        <p className="whitespace-pre-line text-base leading-relaxed text-text">
          {current.statement}
        </p>

        <div className="space-y-2.5">
          {current.options.map((o) => {
            const picked = answers[current.id] === o.letter;
            const showFeedback = runMode === "treino" && answered;
            let tone = "border-border-strong bg-surface hover:border-primary/50";
            if (showFeedback) {
              if (o.letter === current.correctOption)
                tone = "border-ok bg-[var(--ok-soft)] text-ok font-semibold";
              else if (picked) tone = "border-bad bg-[var(--bad-soft)] text-bad";
              else tone = "border-border bg-surface opacity-60";
            } else if (picked) {
              tone = "border-primary bg-primary-soft text-primary font-semibold";
            }
            const comment = current.optionComments?.[o.letter];
            return (
              <div key={o.letter}>
                <button
                  onClick={() => answer(o.letter)}
                  disabled={lockedTreino}
                  aria-pressed={picked}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition sm:text-base",
                    tone,
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-sm font-bold">
                    {o.letter}
                  </span>
                  <span className="pt-0.5">{o.text}</span>
                </button>
                {showFeedback && comment ? (
                  <p
                    className={cn(
                      "ml-10 mt-1 text-xs",
                      o.letter === current.correctOption ? "text-ok" : "text-muted",
                    )}
                  >
                    {o.letter === current.correctOption ? "✓ " : "✗ "}
                    {comment}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {runMode === "treino" && answered ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className={cn("text-sm font-bold", isWrong ? "text-bad" : "text-ok")}>
              {isWrong ? "❌ Não foi dessa vez." : "✅ Você acertou!"}{" "}
              <NameAware
                fallback=""
                render={(n) => (isWrong ? messages.wrong(n) : messages.correct(n))}
              />
            </p>

            {current.explanation ? (
              <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">
                💡 {current.explanation}
              </p>
            ) : null}

            {isWrong ? (
              <div className="rounded-xl border border-[var(--bad)]/20 bg-[var(--bad-soft)] p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-bad">
                  Por que você errou?
                </p>
                <div className="flex flex-wrap gap-2">
                  {ERROR_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReasons((x) => ({ ...x, [current.id]: r }))}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                        reasons[current.id] === r
                          ? "border-bad bg-bad text-white"
                          : "border-[var(--bad)]/30 bg-surface text-bad hover:bg-[var(--bad-soft)]",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* navegação */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => goto(idx - 1)} disabled={idx === 0}>
          ← Anterior
        </Button>

        <span className="text-xs text-faint">
          {Object.keys(answers).length}/{pool.length} respondidas
        </span>

        {idx < pool.length - 1 ? (
          <Button
            variant={runMode === "treino" && !answered ? "secondary" : "primary"}
            onClick={() => goto(idx + 1)}
          >
            Próxima →
          </Button>
        ) : (
          <Button onClick={finish}>Finalizar ✓</Button>
        )}
      </div>

      {isExam ? (
        <p className="mt-4 text-center text-xs text-faint">
          Modo prova: sem gabarito até o fim, mas dá pra voltar e mudar respostas.
        </p>
      ) : null}

      <div className="mt-6 text-center">
        <Link href="/" className="text-xs font-semibold text-faint hover:text-muted">
          Sair do simulado
        </Link>
      </div>
    </div>
  );
}

/* Helper: injeta o nome das configurações em mensagens sem prop drilling. */
function NameAware({
  render,
  fallback,
}: {
  render: (name: string) => string;
  fallback: string;
}) {
  const { settings } = useAppData();
  const [text] = useState(() => render(settings.name || "amor"));
  return <>{text || fallback}</>;
}
