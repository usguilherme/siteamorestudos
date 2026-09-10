"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useHydrated, useSettings } from "@/lib/store";
import { isBareRoute } from "@/components/shell/nav";
import { Sidebar, SidebarDrawer } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import { CommandPalette } from "@/components/shell/CommandPalette";

/** Shell da aplicação: sidebar fixa + topbar + drawer/barra inferior no mobile.
 *  Envolve todas as rotas, exceto as de impressão (`/redacao/folha`). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settings, update] = useSettings();
  const hydrated = useHydrated();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isBareRoute(pathname)) return <>{children}</>;

  const collapsed = hydrated ? !!settings.sidebarCollapsed : false;

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => update({ sidebarCollapsed: !collapsed })}
      />
      <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setDrawerOpen(true)} />
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 pb-20 pt-6 sm:px-6 md:pb-10 lg:px-8">
          {children}
        </main>
      </div>

      <MobileTabBar />
      <CommandPalette />
    </div>
  );
}
