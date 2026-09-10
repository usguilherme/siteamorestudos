"use client";

import { useMemo, useState } from "react";
import {
  toggleFavorite,
  useAppData,
  useFavorites,
  useHydrated,
} from "@/lib/store";
import { areaShort } from "@/lib/enem";
import { cn } from "@/lib/cn";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui";

export default function FavoritasPage() {
  const hydrated = useHydrated();
  const { questions } = useAppData();
  const [favSet] = useFavorites();
  const [reveal, setReveal] = useState<Set<string>>(new Set());

  const favs = useMemo(
    () => questions.filter((q) => favSet.has(q.id)),
    [questions, favSet],
  );

  if (hydrated && favs.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Favoritas ⭐" subtitle="Seu caderno de questões marcadas." />
        <EmptyState
          icon="⭐"
          title="Nenhuma favorita ainda"
          description="Durante um simulado, toque em ☆ favoritar pra guardar a questão aqui."
          action={<ButtonLink href="/simulado">Ir para o simulado</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Favoritas ⭐"
        subtitle={`${favs.length} questão(ões) no caderno`}
        action={
          <ButtonLink href="/simulado?source=favoritas&auto=1" size="sm">
            Treinar favoritas
          </ButtonLink>
        }
      />

      <div className="space-y-3">
        {favs.map((q) => {
          const open = reveal.has(q.id);
          return (
            <Card key={q.id} className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="primary">{areaShort(q.subject)}</Badge>
                <Badge>{q.topic}</Badge>
                <button
                  onClick={() => toggleFavorite(q.id)}
                  className="ml-auto rounded-lg border border-[var(--warn)]/40 bg-[var(--warn-soft)] px-2.5 py-1 text-xs font-semibold text-warn transition hover:opacity-80"
                >
                  ⭐ remover
                </button>
              </div>

              <p className="whitespace-pre-line text-sm text-text">{q.statement}</p>

              {open ? (
                <div className="mt-2 space-y-1 text-sm">
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
                    <p className="mt-1 rounded-lg bg-surface-2 p-2 text-xs text-muted">
                      💡 {q.explanation}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() =>
                  setReveal((r) => {
                    const n = new Set(r);
                    if (n.has(q.id)) n.delete(q.id);
                    else n.add(q.id);
                    return n;
                  })
                }
              >
                {open ? "Ocultar alternativas" : "Ver alternativas"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
