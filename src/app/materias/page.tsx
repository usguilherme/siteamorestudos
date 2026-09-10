"use client";

import { useMemo, useState } from "react";
import { useHydrated } from "@/lib/store";
import { useStats } from "@/lib/stats";
import { useAppData } from "@/lib/store";
import { ENEM_AREAS } from "@/lib/enem";
import { cn } from "@/lib/cn";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui";

export default function MateriasPage() {
  const hydrated = useHydrated();
  const { questions } = useAppData();
  const stats = useStats();
  const [search, setSearch] = useState("");
  const [openArea, setOpenArea] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return questions;
    return questions.filter(
      (q) =>
        q.statement.toLowerCase().includes(s) ||
        q.topic.toLowerCase().includes(s) ||
        q.subject.toLowerCase().includes(s),
    );
  }, [questions, search]);

  const byArea = useMemo(() => {
    const map = new Map<string, typeof questions>();
    for (const q of filtered) {
      const arr = map.get(q.subject) ?? [];
      arr.push(q);
      map.set(q.subject, arr);
    }
    return map;
  }, [filtered]);

  if (hydrated && questions.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Matérias 📚" subtitle="Seu banco de questões por área." />
        <EmptyState
          icon="📄"
          title="Banco de questões vazio"
          description="Cadastre questões manualmente ou importe um PDF de prova."
          action={<ButtonLink href="/admin/nova-questao">Adicionar questões</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Matérias 📚"
        subtitle={`${questions.length} questões no banco`}
        action={
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar questão ou assunto…"
            className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary sm:w-64"
          />
        }
      />

      <div className="space-y-4">
        {ENEM_AREAS.map((area) => {
          const list = byArea.get(area.name) ?? [];
          const areaStat = stats.byArea.find((a) => a.name === area.name);
          const topics = new Map<string, number>();
          for (const q of list) topics.set(q.topic, (topics.get(q.topic) ?? 0) + 1);
          const isOpen = openArea === area.name;

          return (
            <Card key={area.id} className="overflow-hidden">
              <button
                onClick={() => setOpenArea(isOpen ? null : area.name)}
                className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-surface-2"
              >
                <span className="text-2xl">{area.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-text">{area.short}</p>
                  <p className="text-xs text-muted">
                    {list.length} questões · {topics.size} assuntos
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
                <div className="border-t border-border p-5 pt-4">
                  {list.length === 0 ? (
                    <p className="text-sm text-muted">Nenhuma questão nessa área ainda.</p>
                  ) : (
                    <>
                      <div className="mb-4 flex flex-wrap gap-2">
                        <ButtonLink
                          href={`/simulado?area=${encodeURIComponent(area.name)}&auto=1`}
                          size="sm"
                        >
                          Treinar {area.short}
                        </ButtonLink>
                        {[...topics.entries()].map(([t, n]) => (
                          <ButtonLink
                            key={t}
                            href={`/simulado?area=${encodeURIComponent(area.name)}&topic=${encodeURIComponent(t)}&auto=1`}
                            variant="secondary"
                            size="sm"
                          >
                            {t} · {n}
                          </ButtonLink>
                        ))}
                      </div>

                      <div className="space-y-2">
                        {list.map((q) => {
                          const qOpen = openQuestion === q.id;
                          return (
                            <div
                              key={q.id}
                              className="rounded-xl border border-border bg-surface-2/50"
                            >
                              <button
                                onClick={() => setOpenQuestion(qOpen ? null : q.id)}
                                className="flex w-full items-start gap-2 p-3 text-left text-sm"
                              >
                                <span className="text-faint">{qOpen ? "−" : "+"}</span>
                                <span className={cn("flex-1", !qOpen && "line-clamp-2")}>
                                  {q.statement}
                                </span>
                              </button>
                              {qOpen ? (
                                <div className="space-y-1 px-3 pb-3 text-sm">
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
                                  {q.explanation ? (
                                    <p className="mt-1 rounded-lg bg-surface p-2 text-xs text-muted">
                                      💡 {q.explanation}
                                    </p>
                                  ) : null}
                                </div>
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

      <p className="text-center text-xs text-faint">
        Precisa editar ou apagar questões?{" "}
        <a href="/admin/questoes" className="font-semibold hover:text-muted">
          Ir para o painel
        </a>
      </p>
    </div>
  );
}
