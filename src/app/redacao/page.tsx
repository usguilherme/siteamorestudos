"use client";

import { Suspense } from "react";
import { RedacaoApp } from "@/components/redacao/RedacaoApp";

export default function RedacaoPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Carregando…</div>}>
      <RedacaoApp />
    </Suspense>
  );
}
