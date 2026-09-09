import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { themeScript } from "@/lib/theme";
import {
  Footer,
  Navbar,
  ServiceWorkerRegister,
  ThemeSync,
} from "@/components/AppChrome";
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
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-[100dvh] flex-col`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeSync />
        <ServiceWorkerRegister />
        <Navbar />
        <main className="flex-1 pb-16">{children}</main>
        <Footer />
        <Onboarding />
      </body>
    </html>
  );
}
