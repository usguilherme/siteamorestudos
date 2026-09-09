"use client";

import { useRef, useState } from "react";
import {
  exportData,
  importData,
  resetData,
  useHydrated,
  useSettings,
} from "@/lib/store";
import { isFirebaseConfigured } from "@/lib/firebase";
import { DEFAULT_ENEM_DATES } from "@/lib/enem";
import {
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  inputClass,
} from "@/components/ui";
import { cn } from "@/lib/cn";

export default function AjustesPage() {
  const hydrated = useHydrated();
  const [settings, update] = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [flash, setFlash] = useState("");

  const say = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(""), 3500);
  };

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estudos-amor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importData(JSON.parse(String(reader.result)), "merge");
        say("✅ Backup importado (mesclado com o que já existia).");
      } catch {
        say("❌ Arquivo inválido.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const dates = settings.enemDates.length ? settings.enemDates : DEFAULT_ENEM_DATES;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6">
      <PageHeader title="Ajustes ⚙️" subtitle="Personalize o app do seu jeito." />

      {flash ? (
        <p className="rounded-xl bg-surface-2 px-4 py-2 text-sm font-medium text-text">
          {flash}
        </p>
      ) : null}

      <Card className="space-y-5 p-5 sm:p-6">
        <Field label="Como quer ser chamada">
          <input
            className={inputClass}
            value={settings.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Seu nome"
          />
        </Field>

        <Field label="Meta diária de questões" hint="Aparece na home e no desempenho.">
          <input
            type="number"
            min={1}
            max={300}
            className={inputClass}
            value={settings.dailyGoal}
            onChange={(e) => update({ dailyGoal: Math.max(1, Number(e.target.value) || 1) })}
          />
        </Field>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted">Tema</p>
          <div className="grid grid-cols-3 gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => update({ theme: t })}
                className={cn(
                  "rounded-xl border p-2 text-sm font-semibold capitalize transition",
                  settings.theme === t
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border-strong hover:bg-surface-2",
                )}
              >
                {t === "light" ? "☀️ Claro" : t === "dark" ? "🌙 Escuro" : "🖥️ Sistema"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-5 sm:p-6">
        <p className="text-xs font-semibold text-muted">Datas do ENEM (contagem regressiva)</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <input
              key={i}
              type="date"
              className={inputClass}
              value={dates[i] ?? ""}
              onChange={(e) => {
                const next = [...dates];
                next[i] = e.target.value;
                update({ enemDates: next.filter(Boolean) });
              }}
            />
          ))}
        </div>
        <button
          onClick={() => update({ enemDates: DEFAULT_ENEM_DATES })}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Restaurar datas prováveis de 2026
        </button>
      </Card>

      <Card className="space-y-3 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-muted">Sincronização na nuvem</p>
          <Badge tone={isFirebaseConfigured ? "ok" : "neutral"}>
            {isFirebaseConfigured ? "ativa" : "offline"}
          </Badge>
        </div>
        <p className="text-xs text-muted">
          {isFirebaseConfigured
            ? "Seus dados são espelhados no Firebase — abra em qualquer aparelho com o mesmo endereço."
            : "Rodando só neste aparelho. Configure o Firebase (.env) pra sincronizar entre celular e computador."}
        </p>
      </Card>

      <Card className="space-y-3 p-5 sm:p-6">
        <p className="text-xs font-semibold text-muted">Backup dos dados</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={doExport} disabled={!hydrated}>
            Exportar JSON 💾
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Importar JSON 📂
          </Button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={doImport} />
        </div>
      </Card>

      <Card className="space-y-3 border-[var(--bad)]/30 p-5 sm:p-6">
        <p className="text-xs font-semibold text-bad">Zona de perigo</p>
        <Button
          variant="danger"
          onClick={() => {
            if (
              confirm(
                "Apagar TODAS as questões, histórico, favoritas e sessões? Faça um backup antes. Não dá pra desfazer.",
              )
            ) {
              resetData();
              say("Tudo apagado. Recomeço limpo. 🤍");
            }
          }}
        >
          Apagar todos os dados
        </Button>
      </Card>
    </div>
  );
}
