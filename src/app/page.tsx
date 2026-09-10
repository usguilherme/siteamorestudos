"use client";

import { useHydrated, useQuestions } from "@/lib/store";
import { ButtonLink, Card } from "@/components/ui";
import {
  GoalsPanel,
  Hero,
  KpiRow,
  PracticeByArea,
  SpotlightCard,
  WeeklyActivity,
} from "@/components/home/sections";

export default function HomePage() {
  const hydrated = useHydrated();
  const questions = useQuestions();

  return (
    <div className="space-y-8 py-2">
      <Hero />
      <SpotlightCard />
      <KpiRow />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <WeeklyActivity />
        <GoalsPanel />
      </div>

      <PracticeByArea />

      {hydrated && questions.length === 0 ? (
        <Card className="border-dashed p-6 text-center">
          <p className="font-semibold text-text">Seu banco de questões está vazio.</p>
          <p className="mt-1 text-sm text-muted">
            Cadastre questões manualmente ou importe um PDF de prova — a IA organiza
            tudo.
          </p>
          <ButtonLink href="/admin/nova-questao" variant="secondary" className="mt-4">
            Adicionar questões
          </ButtonLink>
        </Card>
      ) : null}
    </div>
  );
}
