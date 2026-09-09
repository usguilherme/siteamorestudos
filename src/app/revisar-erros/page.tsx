"use client";

import { useState } from "react";
import { markReviewed, useHydrated } from "@/lib/store";
import { useReviewQueue } from "@/lib/stats";
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

export default function RevisarErrosPage() {
  const hydrated = useHydrated();
  const queue = useReviewQueue();
  const [showRecovered, setShowRecovered] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const due = queue.filter((i) => i.status === "due");
  const scheduled = queue.filter((i) => i.status === "scheduled");
  const recovered = queue.filter((i) => i.status === "recovered");

  const visible = [
    ...due,
    ...scheduled,
    ...(showRecovered ? recovered : []),
  ];

  if (hydrated && queue.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <PageHeader title="Revisar erros 🔁" subtitle="O que você errou e ainda não recuperou." />
        <EmptyState
          icon="🎯"
          title="Nada pra revisar — por enquanto"
          description="Quando você errar questões nos simulados, elas aparecem aqui numa fila de revisão espaçada."
          action={<ButtonLink href="/simulado">Fazer um simulado</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
      <PageHeader
        title="Revisar erros 🔁"
        subtitle="Fila de revisão espaçada: revise, e a questão volta mais pra frente."
        action={
          due.length > 0 ? (
            <ButtonLink href="/simulado?source=erradas&auto=1" size="sm">
              Treinar erros agora
            </ButtonLink>
          ) : undefined
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-bad">{due.length}</p>
          <p className="text-xs text-muted">pra revisar hoje</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-primary">{scheduled.length}</p>
          <p className="text-xs text-muted">agendadas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-ok">{recovered.length}</p>
          <p className="text-xs text-muted">recuperadas</p>
        </Card>
      </div>

      {recovered.length > 0 ? (
        <button
          onClick={() => setShowRecovered((v) => !v)}
          className="text-xs font-semibold text-muted hover:text-text"
        >
          {showRecovered ? "Ocultar" : "Mostrar"} questões recuperadas
        </button>
      ) : null}

      <div className="space-y-3">
        {visible.map((item) => {
          const q = item.question;
          const isRevealed = revealed.has(q.id);
          return (
            <Card key={q.id} className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {item.status === "due" ? (
                  <Badge tone="bad">revisar agora</Badge>
                ) : item.status === "scheduled" ? (
                  <Badge tone="primary">em {item.dueInDays}d</Badge>
                ) : (
                  <Badge tone="ok">✅ recuperada</Badge>
                )}
                <span className="text-xs text-muted">
                  {areaShort(q.subject)} · {q.topic}
                </span>
                <span className="ml-auto text-xs text-faint">
                  errou {item.errorCount}×
                  {item.lastReason ? ` · ${item.lastReason}` : ""}
                </span>
              </div>

              <p className="whitespace-pre-line text-sm text-text">{q.statement}</p>

              {isRevealed ? (
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

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setRevealed((r) => {
                      const n = new Set(r);
                      if (n.has(q.id)) n.delete(q.id);
                      else n.add(q.id);
                      return n;
                    })
                  }
                >
                  {isRevealed ? "Ocultar gabarito" : "Ver gabarito"}
                </Button>
                {item.status !== "recovered" ? (
                  <Button size="sm" onClick={() => markReviewed(q.id)}>
                    Marquei como revisada
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
