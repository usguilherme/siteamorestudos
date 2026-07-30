import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const enemData = [
  {
    name: "Matemática e suas Tecnologias",
    topics: [
      "Aritmética e Operações Básicas",
      "Razão, Proporção e Regra de Três",
      "Porcentagem e Matemática Financeira",
      "Estatística (Média, Mediana, Moda e Desvio)",
      "Geometria Plana",
      "Geometria Espacial",
      "Geometria Analítica",
      "Funções (Afim, Quadrática, Exponencial e Logarítmica)",
      "Trigonometria",
      "Análise Combinatória e Probabilidade"
    ]
  },
  {
    name: "Linguagens, Códigos e suas Tecnologias",
    topics: [
      "Funções da Linguagem e Variação Linguística",
      "Interpretação e Compreensão de Textos",
      "Figuras de Linguagem",
      "Gêneros Textuais e Tipologia",
      "Modernismo e Vanguardas Artísticas",
      "Literatura Brasileira",
      "Artes e Cultura"
    ]
  },
  {
    name: "Ciências Humanas e suas Tecnologias",
    topics: [
      "História do Brasil (Colônia, Império e República)",
      "História Geral (Idade Média, Moderna e Contemporânea)",
      "Geografia Física e Cartografia",
      "Geografia Humana e Econômica",
      "Sociologia (Cidadania, Trabalho e Movimentos Sociais)",
      "Filosofia Antiga, Moderna e Contemporânea"
    ]
  },
  {
    name: "Ciências da Natureza e suas Tecnologias",
    topics: [
      "Mecânica (Cinemática e Dinâmica)",
      "Termologia e Termodinâmica",
      "Óptica e Ondulatória",
      "Eletrodinâmica e Circuitos Elétricos",
      "Estequiometria e Soluções (Química)",
      "Química Orgânica (Funções e Reações)",
      "Termoquímica e Eletroquímica",
      "Citologia e Biologia Celular",
      "Genética e DNA",
      "Ecologia e Impactos Ambientais",
      "Fisiologia Humana"
    ]
  }
];

export async function seedEnemDatabase() {
  try {
    for (const item of enemData) {
      const subjectRef = await addDoc(collection(db, "subjects"), {
        name: item.name,
      });

      const topicPromises = item.topics.map((topicName) =>
        addDoc(collection(db, "topics"), {
          name: topicName,
          subjectId: subjectRef.id,
        })
      );

      await Promise.all(topicPromises);
    }
    console.log("Banco populado com sucesso!");
    alert("Matérias e assuntos do ENEM cadastrados com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao popular o banco:", error);
    alert("Erro ao popular o banco de dados. Verifique o console.");
    return false;
  }
}