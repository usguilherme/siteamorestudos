import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Estudos do Amor ❤️",
  description: "Plataforma inteligente de estudos para o ENEM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col`}>
        {/* Navbar Moderna */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <span className="text-xl">📚</span> Estudos do Amor <span className="text-red-500">❤️</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link href="/materias" className="transition hover:text-blue-600">Matérias</Link>
              <Link href="/simulado" className="transition hover:text-blue-600">Simulado</Link>
              <Link href="/estatisticas" className="transition hover:text-blue-600">Desempenho</Link>
              <Link href="/historico" className="transition hover:text-blue-600">Histórico</Link>
              <Link href="/favoritas" className="transition hover:text-blue-600">Favoritas</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/nova-questao"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 shadow-sm"
              >
                + Painel Admin
              </Link>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-1 pb-12">
          {children}
        </main>

        {/* Rodapé */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
          Feito com dedicação para os estudos ❤️ • {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}