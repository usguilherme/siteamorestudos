"use client";

import { rateDifficulty } from "@/lib/store";
import { DIFFICULTIES, DIFFICULTY_LABEL, type Difficulty } from "@/types";
import { cn } from "@/lib/cn";

export const DIFF_TONE: Record<Difficulty, "ok" | "warn" | "bad"> = {
  facil: "ok",
  media: "warn",
  dificil: "bad",
};

export const DIFF_EMOJI: Record<Difficulty, string> = {
  facil: "🙂",
  media: "😐",
  dificil: "😰",
};

/** Botõezinhos "Achei fácil / média / difícil" — grava na hora, para qualquer
 *  questão (inclusive as do catálogo, que são somente leitura: a marcação fica
 *  no bloco da aluna, não na questão). Toque de novo no nível já marcado para
 *  desmarcar. */
export function DifficultyRater({
  questionId,
  value,
  label = "Achei essa questão:",
  className,
}: {
  questionId: string;
  value: Difficulty | undefined;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {label ? (
        <span className="text-xs font-semibold text-muted">{label}</span>
      ) : null}
      {DIFFICULTIES.map((d) => {
        const active = value === d;
        return (
          <button
            key={d}
            type="button"
            aria-pressed={active}
            onClick={() => rateDifficulty(questionId, active ? null : d)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
              active
                ? d === "facil"
                  ? "border-ok bg-[var(--ok-soft)] text-ok"
                  : d === "dificil"
                    ? "border-bad bg-[var(--bad-soft)] text-bad"
                    : "border-warn bg-[var(--warn-soft)] text-warn"
                : "border-border-strong text-muted hover:bg-surface-2",
            )}
          >
            {DIFF_EMOJI[d]} {DIFFICULTY_LABEL[d]}
          </button>
        );
      })}
    </div>
  );
}
