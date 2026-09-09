"use client";

import { Suspense } from "react";
import { SimuladoApp } from "@/components/simulado/SimuladoApp";

export default function SimuladoPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Carregando…</div>}>
      <SimuladoApp />
    </Suspense>
  );
}
