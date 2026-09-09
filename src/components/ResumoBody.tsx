import type { Resumo } from "@/lib/resumos";

export function ResumoBody({ resumo }: { resumo: Resumo }) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-faint">O essencial</p>
        <ul className="mt-1 space-y-1 text-muted">
          {resumo.essencial.map((e) => (
            <li key={e} className="flex gap-2">
              <span className="text-primary">•</span>
              {e}
            </li>
          ))}
        </ul>
      </div>

      {resumo.formulas?.length ? (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-faint">Fórmulas</p>
          <div className="mt-1 space-y-1">
            {resumo.formulas.map((f) => (
              <div
                key={f.label}
                className="rounded-lg bg-surface-2 px-3 py-1.5 font-mono text-xs text-text"
              >
                <span className="text-muted">{f.label}: </span>
                {f.expr}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-[var(--warn)]/30 bg-[var(--warn-soft)] px-3 py-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-warn">A pegadinha</p>
        <p className="mt-0.5 text-muted">{resumo.pega}</p>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-faint">Exemplo rápido</p>
        <p className="mt-0.5 text-muted">{resumo.exemplo}</p>
      </div>
    </div>
  );
}
