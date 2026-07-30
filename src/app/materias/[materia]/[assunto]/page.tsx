import Link from "next/link";
import { getTopicById, getSubjectById } from "@/lib/subjects";
import { notFound } from "next/navigation";

interface PageProps {
  params: { materia: string; assunto: string };
}

export default async function DetalheAssuntoPage({ params }: PageProps) {
  const [subject, topic] = await Promise.all([
    getSubjectById(params.materia),
    getTopicById(params.assunto),
  ]);

  if (!subject || !topic) notFound();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-8">
        <Link href={`/materias/${params.materia}`} className="text-sm font-medium text-slate-500 hover:text-slate-800">
          ← Voltar para {subject.name}
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-slate-800">{topic.name}</h1>
        <p className="mb-8 text-slate-500">Preparado para resolver as questões deste assunto?</p>

        <Link
          href={`/topicos/${topic.id}`}
          className="inline-block rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          Começar a Praticar
        </Link>
      </div>
    </div>
  );
}