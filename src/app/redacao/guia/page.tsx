"use client";

import { useState } from "react";
import Link from "next/link";
import {
  COMPETENCIAS,
  ESTRUTURA,
  PROPOSTA_ELEMENTOS,
  REPERTORIO,
  TEMAS_PASSADOS,
  TEMAS_PROVAVEIS,
} from "@/lib/redacao";
import { Badge, Card, PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";

const TABS = [
  { id: "competencias", label: "5 competências" },
  { id: "estrutura", label: "Estrutura" },
  { id: "repertorio", label: "Repertório" },
  { id: "temas", label: "Temas" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function GuiaRedacaoPage() {
  const [tab, setTab] = useState<Tab>("competencias");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Guia de redação ✍️"
        subtitle="O que o corretor procura e onde as notas escorregam."
        action={
          <Link href="/redacao" className="text-sm font-semibold text-muted hover:text-text">
            ← Escrever
          </Link>
        }
      />

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition",
              tab === t.id
                ? "bg-primary-soft text-primary"
                : "text-muted hover:bg-surface-2 hover:text-text",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "competencias" ? (
        <div className="space-y-3">
          {COMPETENCIAS.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-center gap-2">
                <Badge tone="primary">C{c.numero}</Badge>
                <h2 className="font-bold text-text">{c.titulo}</h2>
                <span className="ml-auto text-xs text-faint">0–200</span>
              </div>
              <p className="mt-2 text-sm text-muted">{c.resumo}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-bad">
                O que derruba a nota
              </p>
              <ul className="mt-1 space-y-1 text-sm text-muted">
                {c.derruba.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span className="text-bad">✗</span>
                    {d}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "estrutura" ? (
        <div className="space-y-3">
          {ESTRUTURA.map((p) => (
            <Card key={p.parte} className="p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-bold text-text">{p.parte}</h2>
                <span className="text-xs text-faint">{p.linhas}</span>
              </div>
              <ol className="mt-2 space-y-1.5 text-sm text-muted">
                {p.passos.map((s, i) => (
                  <li key={s} className="flex gap-2">
                    <span className="font-bold text-primary">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
          <Card className="p-5">
            <h2 className="font-bold text-text">
              Proposta de intervenção — os 5 elementos (Competência 5)
            </h2>
            <p className="mt-1 text-xs text-muted">
              Faltar um deles já tira pontos. Todos devem aparecer, de preferência num
              único período bem construído.
            </p>
            <div className="mt-3 space-y-2">
              {PROPOSTA_ELEMENTOS.map((e, i) => (
                <div key={e.nome} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-soft text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <p>
                    <strong className="text-text">{e.nome}:</strong>{" "}
                    <span className="text-muted">{e.desc}</span>
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "repertorio" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Repertório <strong>produtivo</strong> é aquele que sustenta o argumento — não
            é citação de enfeite. Guarde 1–2 por eixo e treine encaixá-los.
          </p>
          {REPERTORIO.map((eixo) => (
            <Card key={eixo.eixo} className="p-5">
              <h2 className="flex items-center gap-2 font-bold text-text">
                <span>{eixo.emoji}</span> {eixo.eixo}
              </h2>
              <div className="mt-3 space-y-3">
                {eixo.itens.map((it) => (
                  <div key={it.ref} className="border-l-2 border-border pl-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-faint">
                      {it.tipo}
                    </p>
                    <p className="text-sm font-semibold text-text">{it.ref}</p>
                    <p className="text-sm text-muted">{it.uso}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "temas" ? (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-bold text-text">Temas prováveis</h2>
            <p className="mt-1 text-xs text-muted">
              Palpites com base em pautas atuais. Treine planejar 2 argumentos + proposta
              pra cada um.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {TEMAS_PROVAVEIS.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <Link
                    href={`/redacao?tema=${encodeURIComponent(t)}`}
                    className="text-text hover:text-primary"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="font-bold text-text">Temas que já caíram</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {TEMAS_PASSADOS.map((t) => (
                <li key={t.ano} className="flex gap-2">
                  <span className="w-10 shrink-0 font-bold text-faint">{t.ano}</span>
                  <Link
                    href={`/redacao?tema=${encodeURIComponent(t.tema)}`}
                    className="text-muted hover:text-primary"
                  >
                    {t.tema}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
