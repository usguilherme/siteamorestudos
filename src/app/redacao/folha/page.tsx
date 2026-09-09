"use client";

import Link from "next/link";
import { Button } from "@/components/ui";

// Folha de redação oficial (30 linhas) para imprimir e treinar à mão.
export default function FolhaRedacaoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/redacao" className="text-sm font-semibold text-muted hover:text-text">
          ← Redação
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          Imprimir 🖨️
        </Button>
      </div>

      <p className="mb-6 text-xs text-muted print:hidden">
        Ajuste a impressão para “Retrato”, margens padrão. Cada folha do ENEM tem 30
        linhas — mínimo 7 linhas escritas, senão a redação zera.
      </p>

      <div className="rounded-xl border border-border bg-white p-6 text-black print:border-0 print:p-0">
        <div className="mb-4 border-b-2 border-black pb-2">
          <p className="text-sm font-bold uppercase tracking-wide">Redação — ENEM</p>
          <div className="mt-2 text-xs">
            <p>Tema: ______________________________________________________________</p>
            <p className="mt-2">Nome: __________________________________ Data: ____/____/______</p>
          </div>
        </div>

        <ol className="folha-linhas">
          {Array.from({ length: 30 }, (_, i) => (
            <li key={i}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <span className="linha" />
            </li>
          ))}
        </ol>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .folha-linhas { list-style: none; margin: 0; padding: 0; }
        .folha-linhas li { display: flex; align-items: flex-end; gap: 10px; height: 34px; }
        .folha-linhas .num { font-size: 10px; color: #666; width: 18px; text-align: right; padding-bottom: 4px; }
        .folha-linhas .linha { flex: 1; border-bottom: 1px solid #000; }
        @media print {
          body { background: #fff; }
          .folha-linhas li { height: 9mm; }
        }
      `,
        }}
      />
    </div>
  );
}
