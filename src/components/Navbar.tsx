import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/materias" className="text-xl font-bold text-emerald-600">
          Estudos do Amor ❤️
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
          <Link href="/materias" className="hover:text-emerald-600 transition">Matérias</Link>
          <Link href="/desempenho" className="hover:text-emerald-600 transition">Desempenho</Link>
          <Link href="/estatisticas" className="hover:text-emerald-600 transition">Estatísticas 📋</Link>
          <Link href="/favoritas" className="hover:text-emerald-600 transition">Favoritas</Link>
          <Link href="/revisar-erros" className="hover:text-emerald-600 transition">Erros</Link>
          <span className="text-slate-300">|</span>
          <Link href="/admin/nova-questao" className="text-slate-400 hover:text-emerald-600 transition">Admin</Link>
        </div>
      </div>
    </nav>
  );
}