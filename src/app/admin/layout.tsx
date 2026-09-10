"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin/nova-questao", label: "Adicionar" },
  { href: "/admin/questoes", label: "Gerenciar" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-faint">Painel</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
          Banco de questões 🛠️
        </h1>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition",
              pathname === t.href
                ? "bg-primary-soft text-primary"
                : "text-muted hover:bg-surface-2 hover:text-text",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
