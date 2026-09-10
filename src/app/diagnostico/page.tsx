"use client";

import { useMemo, useState } from "react";
import { updateSettings, useAppData, useHydrated } from "@/lib/store";
import { usePriorities, useStats } from "@/lib/stats";
import { areaShort, incidenceLabel } from "@/lib/enem";
import { resumoFor } from "@/lib/resumos";
import { cn } from "@/lib/cn";
import {
  Badge,
  ButtonLink,
  Card,
  PageHeader,
  ProgressBar,
} from "@/components/ui";

export default function DiagnosticoPage() {
  const hydrated = useHydrated();
  const { settings, questions } = useAppData();
  const stats = useStats();
  const priorities = usePriorities();
  const [showAll, setShowAll] = useState(false);

  // só assuntos que a plataforma consegue treinar (tem questão cadastrada)
  const trainable = useMemo(() => {
    const withQ = new Set(questions.map((q) => q.topic));
    return priorities.filter((p) => withQ.has(p.topic) || p.attempts > 0);
  }, [priorities, questions]);

  const enoughData = stats.totalAttempts >= 20;
  const list = showAll ? trainable : trainable.slice(0, 8);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Diagnóstico e prioridades 🎯"
        subtitle="O que rende mais ponto: alta incidência no ENEM + seu desempenho atual."
      />

      {!hydrated ? null : !enoughData ? (
        <Card className="p-5">
          <p className="text-sm font-semibold text-text">
            Ainda faltam dados pra um diagnóstico confiável.
          </p>
          <p className="mt-1 text-sm text-muted">
            Você respondeu {stats.totalAttempts} de ~20 questões que eu preciso pra
            mapear seu nível por assunto. Faça um simulado misturando todas as áreas —
            depois volta aqui.
          </p>
          <ProgressBar
            className="mt-3"
            value={(stats.totalAttempts / 20) * 100}
          />
          <ButtonLink href="/simulado?auto=1" className="mt-4">
            Fazer simulado diagnóstico
          </ButtonLink>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.byArea.map((a) => (
              <Card key={a.name} className="p-4">
                <p className="text-xs font-semibold text-faint">{a.short}</p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-extrabold",
                    a.total === 0
                      ? "text-faint"
                      : a.accuracy >= 60
                        ? "text-ok"
                        : "text-warn",
                  )}
                >
                  {a.total === 0 ? "—" : `${a.accuracy}%`}
                </p>
                <p className="text-[11px] text-faint">{a.total} questões</p>
              </Card>
            ))}
          </div>

          {settings.diagnosticDone ? null : (
            <button
              onClick={() => updateSettings({ diagnosticDone: true })}
              className="text-xs font-semibold text-muted hover:text-text"
            >
              Marcar diagnóstico como visto
            </button>
          )}
        </>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-text">
          Estude nesta ordem <span className="font-normal text-faint">(custo-benefício)</span>
        </h2>

        {list.map((p, i) => (
          <Card key={p.topic} className="p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">{p.topic}</p>
                <p className="text-xs text-muted">
                  {areaShort(p.subject)} · {incidenceLabel(p.incidence)}
                  {p.accuracy !== null ? ` · seu acerto: ${p.accuracy}%` : " · não treinado"}
                </p>
                <p className="mt-0.5 text-xs text-faint">{p.reason}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <ButtonLink
                  href={`/simulado?topic=${encodeURIComponent(p.topic)}&area=${encodeURIComponent(p.subject)}&auto=1`}
                  size="sm"
                  variant="secondary"
                >
                  Treinar
                </ButtonLink>
                {resumoFor(p.topic) ? (
                  <ButtonLink
                    href={`/resumos?t=${encodeURIComponent(p.topic)}`}
                    size="sm"
                    variant="ghost"
                  >
                    Resumo
                  </ButtonLink>
                ) : null}
              </div>
            </div>
          </Card>
        ))}

        {trainable.length > 8 ? (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {showAll ? "Ver menos" : `Ver todos os ${trainable.length} assuntos`}
          </button>
        ) : null}

        {trainable.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted">
            Cadastre questões (ou importe um PDF) pra eu montar a lista de prioridades.
          </Card>
        ) : null}
      </div>

      <p className="text-xs text-faint">
        Incidência é uma estimativa do padrão histórico do ENEM, não contagem oficial.{" "}
        <span className="text-primary">
          <Badge tone="primary">dica</Badge>
        </span>{" "}
        priorize o topo da lista: cai muito e você ainda perde ponto ali.
      </p>
    </div>
  );
}
