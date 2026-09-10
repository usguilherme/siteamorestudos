"use client";

import { useState } from "react";
import { useStorageError } from "@/lib/store";

/** Faixa fixa no topo quando o localStorage recusa uma gravação (cota cheia).
 *  Antes, esse erro só ia parar no console — e o banco de questões sumia sem
 *  ninguém ver. */
export function StorageAlert() {
  const error = useStorageError();
  const [dismissed, setDismissed] = useState<string | null>(null);

  if (!error || dismissed === error) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[100] flex items-start gap-3 border-b border-[var(--bad)]/40 bg-[var(--bad-soft)] px-4 py-2.5 text-sm text-text shadow-[var(--shadow)] backdrop-blur"
    >
      <span aria-hidden className="text-base leading-tight">
        ⚠️
      </span>
      <p className="flex-1 leading-snug">{error}</p>
      <button
        type="button"
        onClick={() => setDismissed(error)}
        aria-label="Dispensar aviso"
        className="rounded-control px-2 py-0.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-text"
      >
        Dispensar
      </button>
    </div>
  );
}
