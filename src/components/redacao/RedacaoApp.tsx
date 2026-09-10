"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  addRedacao,
  deleteRedacao,
  updateRedacao,
  updateSettings,
  useHydrated,
  useRedacoes,
  useSettings,
} from "@/lib/store";
import { COMPETENCIAS, TEMAS_PROVAVEIS } from "@/lib/redacao";
import type { RedacaoCorrecao } from "@/types";
import { cn } from "@/lib/cn";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
} from "@/components/ui";

const CHARS_PER_LINE = 90; // aproximação da folha oficial do ENEM

function textStats(text: string) {
  const t = text.trim();
  const words = t ? t.split(/\s+/).length : 0;
  const chars = t.length;
  const lines = t
    ? t.split("\n").reduce((sum, ln) => sum + Math.max(1, Math.ceil(ln.length / CHARS_PER_LINE)), 0)
    : 0;
  return { words, chars, lines };
}

function scoreColor(nota: number, max = 200) {
  const p = nota / max;
  return p >= 0.8 ? "ok" : p >= 0.5 ? "primary" : "warn";
}

export function RedacaoApp() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const redacoes = useRedacoes();
  const [settings] = useSettings();

  const markCorrecaoOpened = (id: string) => {
    const opened = settings.openedCorrecoes ?? [];
    if (!opened.includes(id)) {
      updateSettings({ openedCorrecoes: [...opened, id] });
    }
  };

  const [tema, setTema] = useState(params.get("tema") || "");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const stats = useMemo(() => textStats(text), [text]);

  const sorted = useMemo(
    () => [...redacoes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [redacoes],
  );

  const corrigir = async () => {
    setError("");
    if (stats.chars < 200) {
      setError("Escreva pelo menos alguns parágrafos antes de pedir a correção.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/corrigir-redacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na correção.");

      const correcao = data as RedacaoCorrecao;
      const id = addRedacao({ tema: tema.trim() || "Tema livre", text });
      updateRedacao(id, { correcao });
      setOpenId(id);
      setText("");
      setTema("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const salvarRascunho = () => {
    if (stats.chars < 20) return;
    addRedacao({ tema: tema.trim() || "Rascunho", text });
    setText("");
    setTema("");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Redação ✍️"
        subtitle="Escreva, receba a correção pelas 5 competências e treine à mão."
        action={
          <>
            <ButtonLink href="/redacao/guia" variant="secondary" size="sm">
              Guia
            </ButtonLink>
            <ButtonLink href="/redacao/folha" variant="secondary" size="sm">
              Folha p/ imprimir
            </ButtonLink>
          </>
        }
      />

      {/* Editor */}
      <Card className="space-y-3 p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Tema</span>
          <input
            list="temas-provaveis"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Escolha ou digite o tema"
            className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
          <datalist id="temas-provaveis">
            {TEMAS_PROVAVEIS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="Comece pela contextualização e a tese…"
          className="w-full resize-y rounded-xl border border-border-strong bg-surface p-3 text-sm leading-relaxed text-text outline-none focus:border-primary"
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>{stats.words} palavras</span>
          <span
            className={cn(
              stats.lines > 30 && "font-bold text-bad",
              stats.lines > 0 && stats.lines < 7 && "font-bold text-warn",
            )}
          >
            ~{stats.lines} linhas
          </span>
          <span className="text-faint">(ENEM: 7 a 30 linhas)</span>
        </div>

        {error ? <p className="text-sm font-medium text-bad">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={corrigir} disabled={busy}>
            {busy ? "Corrigindo…" : "Corrigir com IA 🤖"}
          </Button>
          <Button variant="secondary" onClick={salvarRascunho} disabled={busy}>
            Salvar rascunho
          </Button>
        </div>
        <p className="text-xs text-faint">
          A correção é feita por IA e serve de treino — não substitui um corretor humano,
          mas aponta os padrões que derrubam nota.
        </p>
      </Card>

      {/* Histórico */}
      {!hydrated ? null : sorted.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Nenhuma redação ainda"
          description="Escreva a primeira acima. Cada correção fica salva aqui pra você ver a evolução."
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-text">Suas redações ({sorted.length})</h2>
          {sorted.map((r) => {
            const open = openId === r.id;
            return (
              <Card key={r.id} className="p-4">
                <button
                  onClick={() => {
                    const next = open ? null : r.id;
                    setOpenId(next);
                    if (next && r.correcao) markCorrecaoOpened(r.id);
                  }}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{r.tema}</p>
                    <p className="text-xs text-faint">
                      {new Date(r.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}
                      {textStats(r.text).words} palavras
                    </p>
                  </div>
                  {r.correcao ? (
                    <Badge
                      tone={
                        r.correcao.total >= 800
                          ? "ok"
                          : r.correcao.total >= 600
                            ? "primary"
                            : "warn"
                      }
                    >
                      {r.correcao.total} / 1000
                    </Badge>
                  ) : (
                    <Badge tone="neutral">rascunho</Badge>
                  )}
                  <span className="text-faint">{open ? "▲" : "▼"}</span>
                </button>

                {open ? (
                  <div className="mt-4 space-y-4 border-t border-border pt-4">
                    {r.correcao ? <Correcao c={r.correcao} /> : null}

                    <details className="text-sm">
                      <summary className="cursor-pointer font-semibold text-muted">
                        Ver o texto
                      </summary>
                      <p className="mt-2 whitespace-pre-line rounded-xl bg-surface-2 p-3 text-muted">
                        {r.text}
                      </p>
                    </details>

                    <button
                      onClick={() => {
                        if (confirm("Apagar esta redação?")) deleteRedacao(r.id);
                      }}
                      className="text-xs font-semibold text-bad hover:underline"
                    >
                      Apagar
                    </button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Correcao({ c }: { c: RedacaoCorrecao }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-surface-2 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-faint">Nota estimada</p>
        <p className="text-4xl font-extrabold text-primary">{c.total}</p>
        <p className="text-xs text-faint">de 1000</p>
      </div>

      {c.resumo ? <p className="text-sm text-muted">{c.resumo}</p> : null}

      <div className="space-y-3">
        {COMPETENCIAS.map((comp) => {
          const s = c[comp.id];
          if (!s) return null;
          return (
            <div key={comp.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold text-text">
                  C{comp.numero} · {comp.titulo}
                </span>
                <span className="shrink-0 font-bold text-text">{s.nota}/200</span>
              </div>
              <ProgressBar value={(s.nota / 200) * 100} tone={scoreColor(s.nota)} />
              {s.comentario ? (
                <p className="mt-1.5 text-xs text-muted">{s.comentario}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {c.pontosFortes.length > 0 ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ok">Pontos fortes</p>
          <ul className="mt-1 space-y-1 text-sm text-muted">
            {c.pontosFortes.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-ok">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {c.aMelhorar.length > 0 ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-warn">A melhorar</p>
          <ul className="mt-1 space-y-1 text-sm text-muted">
            {c.aMelhorar.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-warn">→</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-right text-[11px] text-faint">
        Correção por {c.model ?? "IA"} ·{" "}
        <Link href="/redacao/guia" className="hover:text-muted">
          entenda as competências
        </Link>
      </p>
    </div>
  );
}
