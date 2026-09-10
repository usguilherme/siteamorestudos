import Link from "next/link";
import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Ajuda" };

const TELAS: { href: string; icon: string; nome: string; texto: string }[] = [
  {
    href: "/plano",
    icon: "🗓️",
    nome: "Plano de hoje",
    texto:
      "O “o que estudar hoje” já pronto: revisão dos erros, questões dos assuntos que mais rendem ponto, redação a cada 3 dias e o resumo do ponto fraco. Cada tarefa é um link direto pro simulado certo.",
  },
  {
    href: "/simulado",
    icon: "📝",
    nome: "Simulado",
    texto:
      "Onde você resolve questões. Filtra por área, assunto, ano e dificuldade; três modos — treino (mostra a resposta na hora), prova (resultado no fim) e prova real (90 questões, 5h30). Atalhos de teclado A–E, N/→, P/←, F.",
  },
  {
    href: "/redacao",
    icon: "✍️",
    nome: "Redação",
    texto:
      "Escreva com contagem de linhas no padrão do ENEM e receba correção por IA nas 5 competências, com nota de 0 a 1000. O Guia traz estrutura, repertório e temas prováveis; a Folha imprime 30 linhas numeradas.",
  },
  {
    href: "/desempenho",
    icon: "📊",
    nome: "Desempenho",
    texto:
      "Seus números: aproveitamento, tempo por questão, nota estimada por área (heurística, não a oficial), evolução do acerto e os motivos dos seus erros.",
  },
  {
    href: "/diagnostico",
    icon: "🎯",
    nome: "Prioridades",
    texto:
      "Responde “o que estudar primeiro?” cruzando o quanto o assunto cai no ENEM com o seu desempenho nele. O topo da lista é o que rende mais ponto agora.",
  },
  {
    href: "/revisar-erros",
    icon: "🔁",
    nome: "Revisar erros",
    texto:
      "Suas questões erradas viram fila de revisão espaçada (1, 3, 7, 15 e 30 dias). Quando você acerta de novo, elas saem da fila. Nunca apaga o histórico.",
  },
  {
    href: "/resumos",
    icon: "📄",
    nome: "Resumos",
    texto:
      "Uma tela por assunto: o essencial em 3 tópicos, as fórmulas, a pegadinha clássica e um exemplo rápido.",
  },
  {
    href: "/materias",
    icon: "📚",
    nome: "Matérias",
    texto:
      "O banco de questões organizado por área, com quantas questões e seu % de acerto em cada uma.",
  },
  {
    href: "/favoritas",
    icon: "⭐",
    nome: "Favoritas",
    texto: "Seu caderno: toda questão que você favoritou (⭐) durante um simulado.",
  },
  {
    href: "/historico",
    icon: "🕘",
    nome: "Histórico",
    texto:
      "Tudo que você já respondeu, com filtros por área, resultado, motivo do erro e período.",
  },
  {
    href: "/ajustes",
    icon: "⚙️",
    nome: "Ajustes",
    texto:
      "Nome, meta diária, tema (claro/escuro/automático), datas do ENEM e backup dos seus dados.",
  },
];

export default function AjudaPage() {
  return (
    <div className="space-y-6 py-2">
      <PageHeader
        title="Ajuda"
        subtitle="Um guia rápido de cada tela. A busca (⌘K) leva direto a qualquer assunto."
      />

      <Card className="p-5">
        <h2 className="text-sm font-bold text-text">Primeiro acesso</h2>
        <p className="mt-1.5 text-sm text-muted">
          Na primeira vez o site pergunta seu nome e a meta diária de questões. Seus
          dados ficam salvos no aparelho e na nuvem — abrir no celular e no
          computador sincroniza sozinho. Dá pra mudar tudo depois em{" "}
          <Link href="/ajustes" className="font-semibold text-primary hover:underline">
            Ajustes
          </Link>
          .
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {TELAS.map((t) => (
          <Card key={t.href} className="p-5">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                {t.icon}
              </span>
              <Link
                href={t.href}
                className="text-sm font-bold text-text hover:text-primary"
              >
                {t.nome}
              </Link>
            </div>
            <p className="mt-1.5 text-sm text-muted">{t.texto}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-bold text-text">Rotina sugerida</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Abre o Plano de hoje e faz as tarefas.</li>
          <li>Errou alguma? Ela vai pra Revisar erros automaticamente.</li>
          <li>Uma vez por semana, olha o Desempenho e as Prioridades.</li>
          <li>Antes de dormir, lê um Resumo do assunto que mais erra.</li>
          <li>A cada 3 dias, uma redação com correção.</li>
          <li>Perto da prova, um Simulado no modo prova real (90 questões, 5h30).</li>
        </ol>
        <p className="mt-3 text-sm text-faint">Um dia de cada vez. 💛</p>
      </Card>
    </div>
  );
}
