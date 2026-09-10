"use client";

import { useMemo, useState } from "react";
import { clearAttempts, deleteAttempt, useAppData, useHydrated } from "@/lib/store";
import { ENEM_AREAS, areaShort } from "@/lib/enem";
import { ERROR_REASONS } from "@/types";
import { cn } from "@/lib/cn";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  selectClass,
} from "@/components/ui";

const PAGE_SIZE = 20;

export default function HistoricoPage() {
  const hydrated = useHydrated();
  const { attempts } = useAppData();
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("TODAS");
  const [result, setResult] = useState<"TODOS" | "acertos" | "erros">("TODOS");
  const [reason, setReason] = useState("TODOS");
  const [period, setPeriod] = useState<"TODOS" | "hoje" | "7" | "30">("TODOS");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const now = new Date().getTime();
    return [...attempts]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((a) => {
        if (s && !a.statement.toLowerCase().includes(s)) return false;
        if (area !== "TODAS" && a.subject !== area) return false;
        if (result === "acertos" && !a.isCorrect) return false;
        if (result === "erros" && a.isCorrect) return false;
        if (reason !== "TODOS" && a.reason !== reason) return false;
        if (period !== "TODOS") {
          const days = (now - new Date(a.createdAt).getTime()) / 86_400_000;
          if (period === "hoje" && days >= 1) return false;
          if (period === "7" && days > 7) return false;
          if (period === "30" && days > 30) return false;
        }
        return true;
      });
  }, [attempts, search, area, result, reason, period]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (hydrated && attempts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Histórico 🕘" subtitle="Tudo que você já respondeu." />
        <EmptyState
          icon="📝"
          title="Nada por aqui ainda"
          description="Responda questões nos simulados pra preencher seu histórico."
          action={<ButtonLink href="/simulado">Fazer um simulado</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Histórico 🕘"
        subtitle={`${attempts.length} respostas registradas`}
        action={
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm("Apagar TODO o histórico, sessões e progresso de revisão? Isso não dá pra desfazer.")) {
                clearAttempts();
              }
            }}
          >
            Limpar tudo
          </Button>
        }
      />

      <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar no enunciado…"
          className="rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary sm:col-span-2 lg:col-span-1"
        />
        <select className={selectClass} value={area} onChange={(e) => { setArea(e.target.value); setPage(1); }}>
          <option value="TODAS">Todas as áreas</option>
          {ENEM_AREAS.map((a) => (
            <option key={a.id} value={a.name}>{a.short}</option>
          ))}
        </select>
        <select className={selectClass} value={result} onChange={(e) => { setResult(e.target.value as typeof result); setPage(1); }}>
          <option value="TODOS">Acertos e erros</option>
          <option value="acertos">Só acertos</option>
          <option value="erros">Só erros</option>
        </select>
        <select className={selectClass} value={reason} onChange={(e) => { setReason(e.target.value); setPage(1); }}>
          <option value="TODOS">Qualquer motivo</option>
          {ERROR_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select className={selectClass} value={period} onChange={(e) => { setPeriod(e.target.value as typeof period); setPage(1); }}>
          <option value="TODOS">Todo o período</option>
          <option value="hoje">Hoje</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
        </select>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">
          Nenhum registro pra esses filtros.
        </Card>
      ) : (
        <div className="space-y-2.5">
          {shown.map((a) => (
            <Card
              key={a.id}
              className={cn(
                "flex items-start gap-3 p-4",
                a.isCorrect ? "border-l-4 border-l-ok" : "border-l-4 border-l-bad",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={a.isCorrect ? "ok" : "bad"}>
                    {a.isCorrect ? "✅ acertou" : "❌ errou"}
                  </Badge>
                  <span className="text-xs text-faint">
                    {new Date(a.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-xs text-faint">· {areaShort(a.subject)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-text">{a.statement}</p>
                <p className="mt-0.5 text-xs text-muted">
                  Respondeu <strong>{a.userAnswer || "—"}</strong>
                  {" · "}gabarito <strong>{a.correctAnswer || "?"}</strong>
                  {a.reason ? ` · ${a.reason}` : ""}
                </p>
              </div>
              <button
                onClick={() => deleteAttempt(a.id)}
                aria-label="Excluir registro"
                className="shrink-0 rounded-lg p-1.5 text-faint transition hover:bg-surface-2 hover:text-bad"
              >
                🗑️
              </button>
            </Card>
          ))}

          {pageCount > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-3">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                ← Anterior
              </Button>
              <span className="text-xs font-semibold text-muted">
                {page} / {pageCount}
              </span>
              <Button variant="secondary" size="sm" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>
                Próxima →
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
