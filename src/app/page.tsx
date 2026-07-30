import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-12">
      {/* Hero Section Premium */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white via-indigo-50/30 to-blue-50/50 p-8 sm:p-16 shadow-xl shadow-slate-100 text-center space-y-8">
        {/* Glow effect de fundo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-indigo-600 shadow-sm border border-indigo-100">
          <span className="animate-pulse">✨</span> Powered by Google Gemini & Next.js
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Estudos do Amor <span className="text-rose-500 inline-block animate-bounce">❤️</span>
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          A plataforma definitiva de alta performance para o ENEM. Extração inteligente de PDFs por IA, simulados cronometrados e análises profundas de desempenho.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/simulado"
            className="group relative inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Começar Simulado</span>
            <span className="transition-transform group-hover:translate-x-1">🚀</span>
          </Link>

          <Link
            href="/admin/nova-questao"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:scale-[1.02]"
          >
            <span>📄 Importar PDF com IA</span>
          </Link>
        </div>
      </div>

      {/* Grid de Recursos / Cards Estilo Google */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Link
          href="/simulado"
          className="group relative rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 space-y-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl transition-transform group-hover:scale-110">
            📝
          </div>
          <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Simulado Inteligente
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Resolva questões filtradas por matéria ou tópico com cronômetro integrado e registro analítico de erros.
          </p>
        </Link>

        <Link
          href="/estatisticas"
          className="group relative rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 space-y-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl transition-transform group-hover:scale-110">
            📊
          </div>
          <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Painel de Desempenho
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Métricas executivas detalhadas por assunto, taxa de acertos e motivos de falha mapeados para correção rápida.
          </p>
        </Link>

        <Link
          href="/favoritas"
          className="group relative rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 space-y-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl transition-transform group-hover:scale-110">
            ⭐
          </div>
          <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Caderno de Favoritas
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Acesse instantaneamente questões marcadas com estrela para revisões estratégicas antes da prova.
          </p>
        </Link>
      </div>
    </div>
  );
}