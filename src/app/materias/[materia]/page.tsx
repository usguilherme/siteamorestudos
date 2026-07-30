import Link from "next/link";
import { getTopicsBySubject } from "@/lib/subjects";
import { Topic } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props {
  params: {
    id: string;
  };
}

export default async function TopicosPorMateriaPage({ params }: Props) {
  const subjectId = params.id;

  // 1. Busca o nome da matéria
  const subjectDocRef = doc(db, "subjects", subjectId);
  const subjectSnap = await getDoc(subjectDocRef);
  const subjectName = subjectSnap.exists() ? subjectSnap.data().name : "Matéria";

  // 2. Busca os assuntos (tópicos) dessa matéria
  const topics: Topic[] = await getTopicsBySubject(subjectId);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/materias" className="text-sm font-medium text-emerald-600 hover:underline">
            ← Voltar para Matérias
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">{subjectName} 📖</h1>
        </div>
      </div>

      {topics.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Nenhum assunto cadastrado para esta matéria ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topicos/${topic.id}`}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-500 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-slate-800">{topic.name}</h2>
              <p className="mt-2 text-sm text-emerald-600 font-medium">Resolver questões →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}