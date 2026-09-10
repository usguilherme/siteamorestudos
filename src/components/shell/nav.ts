// Configuração única da navegação do shell (sidebar, drawer, barra inferior)
// e do breadcrumb da topbar. Sem "use client" — é só dados.

export type BadgeKind = "plano" | "revisar";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: BadgeKind;
}

/** Navegação principal — ordem da sidebar. */
export const NAV_PRIMARY: NavItem[] = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/simulado", label: "Simulado", icon: "📝" },
  { href: "/plano", label: "Plano", icon: "🗓️", badge: "plano" },
  { href: "/redacao", label: "Redação", icon: "✍️" },
  { href: "/resumos", label: "Resumos", icon: "📄" },
  { href: "/materias", label: "Matérias", icon: "📚" },
  { href: "/revisar-erros", label: "Revisar erros", icon: "🔁", badge: "revisar" },
  { href: "/desempenho", label: "Desempenho", icon: "📊" },
  { href: "/diagnostico", label: "Prioridades", icon: "🎯" },
  { href: "/favoritas", label: "Favoritas", icon: "⭐" },
  { href: "/historico", label: "Histórico", icon: "🕘" },
];

/** Rodapé da sidebar. */
export const NAV_SECONDARY: NavItem[] = [
  { href: "/ajustes", label: "Ajustes", icon: "⚙️" },
  { href: "/ajuda", label: "Ajuda", icon: "💡" },
];

/** Barra inferior fixa no celular — a navegação real abaixo de md. */
export const MOBILE_TABS: NavItem[] = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/plano", label: "Plano", icon: "🗓️" },
  { href: "/simulado", label: "Simulado", icon: "📝" },
  { href: "/desempenho", label: "Desempenho", icon: "📊" },
];

/** Rotas que rodam SEM o shell (impressão limpa). */
export const BARE_ROUTES = ["/redacao/folha"];

export function isBareRoute(pathname: string): boolean {
  return BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// Rótulos extras que não estão na navegação mas precisam de breadcrumb.
const EXTRA_LABELS: Record<string, string> = {
  "/estatisticas": "Estatísticas",
  "/redacao/guia": "Guia da redação",
  "/admin/nova-questao": "Nova questão",
  "/admin/questoes": "Gerenciar questões",
};

const ALL_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    [...NAV_PRIMARY, ...NAV_SECONDARY].map((n) => [n.href, n.label]),
  ),
  ...EXTRA_LABELS,
};

/** Trilha "Início · X" para a topbar. */
export function breadcrumb(pathname: string): string[] {
  if (pathname === "/") return ["Início", "Painel"];

  // rota mais específica que casa com o começo do pathname
  let best = "";
  for (const href of Object.keys(ALL_LABELS)) {
    if (href === "/") continue;
    if ((pathname === href || pathname.startsWith(href + "/")) && href.length > best.length) {
      best = href;
    }
  }
  if (!best) return ["Início"];

  const trail = ["Início", ALL_LABELS[best]];
  if (pathname !== best && ALL_LABELS[pathname]) trail.push(ALL_LABELS[pathname]);
  return trail;
}
