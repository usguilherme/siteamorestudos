"use client";

import { useMemo, useState } from "react";
import {
  effectiveDifficulty,
  useAppData,
  useCatalogState,
  useDifficultyRatings,
  useFavorites,
  useHydrated,
} from "@/lib/store";
import { useStats } from "@/lib/stats";
import { ENEM_AREAS, areaId } from "@/lib/enem";
import { DIFFICULTIES, DIFFICULTY_LABEL, type Difficulty } from "@/types";
import { cn } from "@/lib/cn";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { DifficultyRater, DIFF_TONE } from "@/components/DifficultyRater";

const NO_AREA = "sem-area";
const NO_TOPIC = "Sem assunto classificado";
const PER_PAGE = 20;

type Q = ReturnType<typeof useAppData>["questions"][number];

export default function MateriasPage() {
  const hydrated = useHydrated();
  const catalogState = useCatalogState();
  const { questions, attempts } = useAppData();
  const stats = useStats();
  const [favSet] = useFavorites();
  const [ratings] = useDifficultyRatings();

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [onlyWrong, setOnlyWrong] = useState(false);
  const [onlyFav, setOnlyFav] = useState(false);

  const [openArea, setOpenArea] = useState<string | null>(null);
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // última tentativa de cada questão foi errada?
  const wrongIds = useMemo(() => {
    const last = new Map<string, boolean>();
    for (const a of [...attempts].sort((x, y) => x.createdAt.localeCompare(y.createdAt))) {
      if (a.questionId) last.set(a.questionId, a.isCorrect);
    }
    const s = new Set<string>();
    for (const [id, ok] of last) if (!ok) s.add(id);
    return s;
  }, [attempts]);

  const accByTopic = useMemo(() => {
    const m = new Map<string, { total: number; correct: number }>();
    for (const t of stats.byTopic) m.set(t.topic, { total: t.total, correct: t.correct });
    return m;
  }, [stats.byTopic]);

  const availableYears = useMemo(
    () =>
      [...new Set(questions.map((q) => q.year).filter((y): y is number => !!y))].sort(
        (a, b) => b - a,
      ),
    [questions],
  );

  const anyFilter = !!(year || difficulty || onlyWrong || onlyFav);

  // filtros globais (área e assunto são a navegação em árvore abaixo)
  const base = useMemo(() => {
    return questions.filter((q) => {
      if (year && String(q.year) !== year) return false;
      if (difficulty && effectiveDifficulty(q, ratings) !== difficulty) return false;
      if (onlyWrong && !wrongIds.has(q.id)) return false;
      if (onlyFav && !favSet.has(q.id)) return false;
      return true;
    });
  }, [questions, year, difficulty, onlyWrong, onlyFav, wrongIds, favSet, ratings]);

  // agrupamento por área — TODA questão cai em exatamente um balde, então a
  // soma dos baldes é sempre igual a base.length (invariante).
  const byArea = useMemo(() => {
    const m = new Map<string, Q[]>();
    for (const q of base) {
      const id = areaId(q.subject) ?? NO_AREA;
      const arr = m.get(id);
      if (arr) arr.push(q);
      else m.set(id, [q]);
    }
    return m;
  }, [base]);

  const areaRows = useMemo(() => {
    const rows = ENEM_AREAS.map((a) => ({
      id: a.id,
      name: a.name,
      short: a.short,
      emoji: a.emoji,
      list: byArea.get(a.id) ?? [],
    }));
    const orphans = byArea.get(NO_AREA) ?? [];
    if (orphans.length) {
      rows.push({
        id: NO_AREA,
        name: "Sem área definida",
        short: "Sem área",
        emoji: "❓",
        list: orphans,
      });
    }
    return rows;
  }, [byArea]);

  const shownTotal = areaRows.reduce((s, r) => s + r.list.length, 0);

  // busca — resultado achatado, agrupado por área, paginado
  const searchResults = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return null;
    const hits = base.filter(
      (q) =>
        q.statement.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s),
    );
    const groups = new Map<string, Q[]>();
    for (const r of areaRows) {
      const g = hits.filter((q) => (areaId(q.subject) ?? NO_AREA) === r.id);
      if (g.length) groups.set(r.id, g);
    }
    return { total: hits.length, groups };
  }, [search, base, areaRows]);

  if (hydrated && catalogState === "error" && questions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Matérias 📚" subtitle="Banco de questões por área." />
        <EmptyState
          icon="📡"
          title="Não consegui carregar o banco de questões"
          description="O catálogo é baixado do próprio site. Verifique a conexão e recarregue a página."
        />
      </div>
    );
  }

  const loading = !hydrated || (catalogState !== "ready" && questions.length === 0);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Matérias 📚"
        subtitle={
          loading
            ? "Carregando o banco de questões…"
            : anyFilter
              ? `${shownTotal} de ${questions.length} questões (filtro ativo)`
              : `${questions.length} questões · ENEM 2009–2023`
        }
        action={
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar no enunciado ou assunto…"
            className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary sm:w-72"
          />
        }
      />

      {/* filtros */}
      <Card className="flex flex-wrap items-center gap-2 p-3">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
        >
          <option value="">Qualquer ano</option>
          {availableYears.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
          className="rounded-lg border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
        >
          <option value="">Qualquer nível</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </option>
          ))}
        </select>
        <FilterToggle active={onlyWrong} onClick={() => setOnlyWrong((v) => !v)}>
          Só as que errei
        </FilterToggle>
        <FilterToggle active={onlyFav} onClick={() => setOnlyFav((v) => !v)}>
          ⭐ Só favoritas
        </FilterToggle>
        {anyFilter ? (
          <button
            onClick={() => {
              setYear("");
              setDifficulty("");
              setOnlyWrong(false);
              setOnlyFav(false);
            }}
            className="ml-auto text-xs font-semibold text-muted hover:text-text"
          >
            Limpar filtros
          </button>
        ) : null}
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted">Carregando…</Card>
      ) : searchResults ? (
        <SearchView
          results={searchResults}
          areaRows={areaRows}
          page={page}
          setPage={setPage}
          openQuestion={openQuestion}
          setOpenQuestion={setOpenQuestion}
          filterQS={buildQS({ year, difficulty, onlyWrong, onlyFav })}
        />
      ) : (
        <div className="space-y-4">
          {areaRows.map((area) => {
            const areaStat = stats.byArea.find((a) => a.name === area.name);
            const isOpen = openArea === area.id;

            // assuntos com contagem
            const topicCount = new Map<string, number>();
            for (const q of area.list) {
              const t = q.topic || NO_TOPIC;
              topicCount.set(t, (topicCount.get(t) ?? 0) + 1);
            }
            const known =
              area.id === NO_AREA
                ? []
                : (ENEM_AREAS.find((a) => a.id === area.id)?.topics ?? []);
            const orderedTopics = [
              ...known.filter((t) => topicCount.has(t)),
              ...[...topicCount.keys()].filter(
                (t) => !known.includes(t) && t !== NO_TOPIC,
              ),
              ...(topicCount.has(NO_TOPIC) ? [NO_TOPIC] : []),
            ];

            return (
              <Card key={area.id} className="overflow-hidden">
                <button
                  onClick={() => {
                    setOpenArea(isOpen ? null : area.id);
                    setOpenTopic(null);
                    setPage(1);
                  }}
                  className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-surface-2"
                >
                  <span className="text-2xl">{area.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-text">{area.short}</p>
                    <p className="text-xs text-muted">
                      {area.list.length}{" "}
                      {area.list.length === 1 ? "questão" : "questões"} ·{" "}
                      {orderedTopics.length}{" "}
                      {orderedTopics.length === 1 ? "assunto" : "assuntos"}
                    </p>
                  </div>
                  {areaStat && areaStat.total > 0 ? (
                    <Badge tone={areaStat.accuracy >= 60 ? "ok" : "warn"}>
                      {areaStat.accuracy}% acerto
                    </Badge>
                  ) : null}
                  <span className="text-faint">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen ? (
                  <div className="border-t border-border p-4">
                    {area.list.length === 0 ? (
                      <p className="p-2 text-sm text-muted">
                        Nenhuma questão nessa área com os filtros atuais.
                      </p>
                    ) : (
                      <>
                        {area.id !== NO_AREA ? (
                          <ButtonLink
                            href={`/simulado?auto=1&area=${encodeURIComponent(
                              area.name,
                            )}${buildQS({ year, difficulty, onlyWrong, onlyFav })}`}
                            size="sm"
                            className="mb-3"
                          >
                            Treinar {area.short} · {area.list.length}
                          </ButtonLink>
                        ) : null}

                        <div className="space-y-1.5">
                          {orderedTopics.map((topic) => {
                            const n = topicCount.get(topic) ?? 0;
                            const acc = accByTopic.get(topic);
                            const tOpen = openTopic === `${area.id}::${topic}`;
                            return (
                              <div
                                key={topic}
                                className="rounded-xl border border-border bg-surface-2/40"
                              >
                                <button
                                  onClick={() => {
                                    setOpenTopic(tOpen ? null : `${area.id}::${topic}`);
                                    setPage(1);
                                  }}
                                  className="flex w-full items-center gap-3 p-3 text-left"
                                >
                                  <span className="text-faint text-xs">
                                    {tOpen ? "−" : "+"}
                                  </span>
                                  <span
                                    className={cn(
                                      "flex-1 text-sm",
                                      topic === NO_TOPIC
                                        ? "italic text-muted"
                                        : "text-text",
                                    )}
                                  >
                                    {topic}
                                  </span>
                                  {acc && acc.total > 0 ? (
                                    <span className="text-xs text-muted">
                                      {Math.round((acc.correct / acc.total) * 100)}% em{" "}
                                      {acc.total}
                                    </span>
                                  ) : null}
                                  <Badge tone="neutral">{n}</Badge>
                                </button>

                                {tOpen ? (
                                  <TopicQuestions
                                    list={area.list
                                      .filter(
                                        (q) => (q.topic || NO_TOPIC) === topic,
                                      )
                                      .sort(
                                        (a, b) =>
                                          (b.year ?? 0) - (a.year ?? 0) ||
                                          a.id.localeCompare(b.id),
                                      )}
                                    page={page}
                                    setPage={setPage}
                                    openQuestion={openQuestion}
                                    setOpenQuestion={setOpenQuestion}
                                    simuladoHref={
                                      area.id === NO_AREA
                                        ? null
                                        : `/simulado?auto=1&area=${encodeURIComponent(
                                            area.name,
                                          )}${
                                            topic === NO_TOPIC
                                              ? ""
                                              : `&topic=${encodeURIComponent(topic)}`
                                          }${buildQS({
                                            year,
                                            difficulty,
                                            onlyWrong,
                                            onlyFav,
                                          })}`
                                    }
                                  />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-faint">
        Cobertura: provas do ENEM de 2009 a 2023 (fonte aberta{" "}
        <span className="font-semibold">enem.dev</span>). Para editar ou apagar
        questões suas,{" "}
        <a href="/admin/questoes" className="font-semibold hover:text-muted">
          vá para o painel
        </a>
        .
      </p>
    </div>
  );
}

function buildQS(f: {
  year: string;
  difficulty: string;
  onlyWrong: boolean;
  onlyFav: boolean;
}): string {
  const p = new URLSearchParams();
  if (f.year) p.set("year", f.year);
  if (f.difficulty) p.set("diff", f.difficulty);
  if (f.onlyWrong) p.set("source", "erradas");
  else if (f.onlyFav) p.set("source", "favoritas");
  const s = p.toString();
  return s ? `&${s}` : "";
}

function FilterToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border-strong text-muted hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

function Pager({
  page,
  pageCount,
  setPage,
}: {
  page: number;
  pageCount: number;
  setPage: (n: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-3">
      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        className="rounded-lg border border-border-strong px-2 py-1 text-xs font-semibold text-muted disabled:opacity-40"
      >
        ←
      </button>
      <span className="text-xs font-semibold text-muted">
        {page} / {pageCount}
      </span>
      <button
        disabled={page === pageCount}
        onClick={() => setPage(page + 1)}
        className="rounded-lg border border-border-strong px-2 py-1 text-xs font-semibold text-muted disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}

function QuestionRow({
  q,
  open,
  onToggle,
}: {
  q: Q;
  open: boolean;
  onToggle: () => void;
}) {
  const [ratings] = useDifficultyRatings();
  const rating = ratings[q.id];
  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-2 p-3 text-left text-sm"
      >
        <span className="text-faint">{open ? "−" : "+"}</span>
        <span className="flex-1">
          {q.year ? (
            <span className="mr-1.5 font-semibold text-faint">{q.year}</span>
          ) : null}
          <span className={cn(!open && "line-clamp-2")}>{q.statement}</span>
        </span>
        {rating ? (
          <Badge tone={DIFF_TONE[rating]}>{DIFFICULTY_LABEL[rating]}</Badge>
        ) : null}
      </button>
      {open ? (
        <div className="space-y-2 px-3 pb-3 text-sm">
          <DifficultyRater questionId={q.id} value={rating} />
          <div className="space-y-1">
            {q.options.map((o) => (
              <div
                key={o.letter}
                className={cn(
                  "rounded-lg px-2 py-1",
                  o.letter === q.correctOption
                    ? "bg-[var(--ok-soft)] font-semibold text-ok"
                    : "text-muted",
                )}
              >
                <span className="font-bold">{o.letter})</span> {o.text}
              </div>
            ))}
          </div>
          {q.explanation ? (
            <p className="mt-1 rounded-lg bg-surface-2 p-2 text-xs text-muted">
              💡 {q.explanation}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TopicQuestions({
  list,
  page,
  setPage,
  openQuestion,
  setOpenQuestion,
  simuladoHref,
}: {
  list: Q[];
  page: number;
  setPage: (n: number) => void;
  openQuestion: string | null;
  setOpenQuestion: (id: string | null) => void;
  simuladoHref: string | null;
}) {
  const pageCount = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const shown = list.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <div className="border-t border-border p-3">
      {simuladoHref ? (
        <ButtonLink href={simuladoHref} size="sm" variant="secondary" className="mb-3">
          Montar simulado com estas {list.length} 🚀
        </ButtonLink>
      ) : null}
      <div className="space-y-1.5">
        {shown.map((q) => (
          <QuestionRow
            key={q.id}
            q={q}
            open={openQuestion === q.id}
            onToggle={() => setOpenQuestion(openQuestion === q.id ? null : q.id)}
          />
        ))}
      </div>
      <Pager page={safePage} pageCount={pageCount} setPage={setPage} />
    </div>
  );
}

function SearchView({
  results,
  areaRows,
  page,
  setPage,
  openQuestion,
  setOpenQuestion,
  filterQS,
}: {
  results: { total: number; groups: Map<string, Q[]> };
  areaRows: { id: string; name: string; short: string; emoji: string }[];
  page: number;
  setPage: (n: number) => void;
  openQuestion: string | null;
  setOpenQuestion: (id: string | null) => void;
  filterQS: string;
}) {
  if (results.total === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted">
        Nenhuma questão encontrada para essa busca.
      </Card>
    );
  }
  // achatado com paginação global sobre a ordem das áreas
  const flat: { area: (typeof areaRows)[number]; q: Q }[] = [];
  for (const r of areaRows) {
    for (const q of results.groups.get(r.id) ?? []) flat.push({ area: r, q });
  }
  const pageCount = Math.max(1, Math.ceil(flat.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const shown = flat.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <Card className="p-4">
      <p className="mb-3 text-xs font-semibold text-muted">
        {results.total} {results.total === 1 ? "resultado" : "resultados"}
      </p>
      <div className="space-y-1.5">
        {shown.map(({ area, q }) => (
          <div key={q.id}>
            <div className="mb-1 flex items-center gap-2 text-xs text-faint">
              <span>{area.emoji}</span>
              <span>{area.short}</span>
              {q.topic ? <span>· {q.topic}</span> : null}
            </div>
            <QuestionRow
              q={q}
              open={openQuestion === q.id}
              onToggle={() => setOpenQuestion(openQuestion === q.id ? null : q.id)}
            />
          </div>
        ))}
      </div>
      <Pager page={safePage} pageCount={pageCount} setPage={setPage} />
      {filterQS ? (
        <p className="mt-3 text-center text-[11px] text-faint">
          Filtros de ano/dificuldade também se aplicam à busca.
        </p>
      ) : null}
    </Card>
  );
}
