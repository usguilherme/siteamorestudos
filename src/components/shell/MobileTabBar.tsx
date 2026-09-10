"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { MOBILE_TABS, isActive } from "@/components/shell/nav";

/** Navegação real no celular. O drawer cobre o resto. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      {MOBILE_TABS.map((t) => {
        const active = isActive(pathname, t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors",
              active ? "text-primary" : "text-faint",
            )}
          >
            <span className="text-lg leading-none" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
