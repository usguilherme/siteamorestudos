import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { themeScript } from "@/lib/theme";
import { ServiceWorkerRegister, ThemeSync } from "@/components/AppChrome";
import { AppShell } from "@/components/shell/AppShell";
import { Onboarding } from "@/components/Onboarding";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://estudos-amor.vercel.app"),
  title: {
    default: "Estudos do Amor ❤️",
    template: "%s · Estudos do Amor",
  },
  description:
    "Plataforma de estudos para o ENEM: simulados cronometrados, revisão inteligente de erros e acompanhamento de desempenho.",
  applicationName: "Estudos do Amor",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Estudos do Amor" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0d15" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeSync />
        <ServiceWorkerRegister />
        <AppShell>{children}</AppShell>
        <Onboarding />
      </body>
    </html>
  );
}
