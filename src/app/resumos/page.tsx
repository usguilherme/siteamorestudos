"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RESUMOS } from "@/lib/resumos";
import { ENEM_AREAS, areaEmoji } from "@/lib/enem";
import { cn } from "@/lib/cn";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { ResumoBody } from "@/components/ResumoBody";

export default function ResumosPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Carregando…</div>}>
      <ResumosInner />
    </Suspense>
  );
}

function ResumosInner() {
  const params = useSearchParams();
  const [open, setOpen] = useState<string | null>(params.get("t"));
  const [area, setArea] = useState("TODAS");

  const list = useMemo(
    () => (area === "TODAS" ? RESUMOS : RESUMOS.filter((r) => r.area === area)),
    [area],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
      <PageHeader
        title="Resumos rápidos 📄"
        subtitle="Uma tela por assunto: o essencial, as fórmulas e a pegadinha."
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setArea("TODAS")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
            area === "TODAS" ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted",
          )}
        >
          Todas
        </button>
        {ENEM_AREAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setArea(a.name)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
              area === a.name ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted",
            )}
          >
            {a.emoji} {a.short}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((r) => {
          const isOpen = open === r.topic;
          return (
            <Card key={r.topic} className="overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : r.topic)}
                className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-surface-2"
              >
                <span className="text-xl">{areaEmoji(r.area)}</span>
                <span className="flex-1 font-bold text-text">{r.topic}</span>
                <span className="text-faint">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen ? (
                <div className="border-t border-border p-4">
                  <ResumoBody resumo={r} />
                  <ButtonLink
                    href={`/simulado?topic=${encodeURIComponent(r.topic)}&auto=1`}
                    size="sm"
                    className="mt-4"
                  >
                    Treinar {r.topic.split(" ")[0]}
                  </ButtonLink>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-faint">
        São resumos de apoio pra revisão rápida — não substituem o estudo completo do conteúdo.
      </p>
    </div>
  );
}
