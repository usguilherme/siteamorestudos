"use client";

import { useState } from "react";
import { useHydrated, useSettings } from "@/lib/store";
import { Button } from "@/components/ui";

export function Onboarding() {
  const hydrated = useHydrated();
  const [settings, update] = useSettings();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(15);

  if (!hydrated || settings.onboarded) return null;

  const finish = () => {
    update({
      name: name.trim() || "amor",
      dailyGoal: Math.max(1, Math.min(200, goal || 15)),
      onboarded: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-fade-up rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-3xl">
            ❤️
          </div>
          <h2 className="text-xl font-extrabold text-text">Bem-vinda!</h2>
          <p className="mt-1 text-sm text-muted">
            Esse cantinho foi feito pra te ajudar a passar no ENEM. Como posso te chamar?
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            finish();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              Seu nome
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Valessa"
              className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">
              Meta diária de questões
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            Bora estudar 🚀
          </Button>
        </form>
      </div>
    </div>
  );
}
