// Fonte única das áreas e assuntos do ENEM. Antes essa lista estava duplicada
// (e divergente) em 5 arquivos diferentes.

export interface EnemArea {
  id: string;
  name: string;
  short: string;
  emoji: string;
  topics: string[];
}

export const ENEM_AREAS: EnemArea[] = [
  {
    id: "matematica",
    name: "Matemática e suas Tecnologias",
    short: "Matemática",
    emoji: "🔢",
    topics: [
      "Aritmética e Operações Básicas",
      "Razão, Proporção e Regra de Três",
      "Porcentagem e Matemática Financeira",
      "Estatística (Média, Mediana, Moda e Desvio)",
      "Grandezas e Medidas",
      "Geometria Plana",
      "Geometria Espacial",
      "Geometria Analítica",
      "Funções (Afim, Quadrática, Exponencial e Logarítmica)",
      "Progressões (PA e PG)",
      "Trigonometria",
      "Análise Combinatória e Probabilidade",
      "Matrizes e Sistemas Lineares",
    ],
  },
  {
    id: "linguagens",
    name: "Linguagens, Códigos e suas Tecnologias",
    short: "Linguagens",
    emoji: "📖",
    topics: [
      "Interpretação e Compreensão de Textos",
      "Funções da Linguagem",
      "Variação Linguística",
      "Figuras de Linguagem",
      "Gêneros Textuais e Tipologia",
      "Gramática e Norma-Padrão",
      "Literatura Brasileira",
      "Modernismo e Vanguardas Artísticas",
      "Artes, Música e Cultura",
      "Educação Física e Corpo",
      "Língua Estrangeira (Inglês/Espanhol)",
      "Tecnologias da Informação e Comunicação",
    ],
  },
  {
    id: "humanas",
    name: "Ciências Humanas e suas Tecnologias",
    short: "Humanas",
    emoji: "🌎",
    topics: [
      "História do Brasil Colônia",
      "Brasil Império",
      "Brasil República (Velha, Vargas, Militar, Nova República)",
      "História Geral (Antiga, Medieval, Moderna)",
      "História Contemporânea (Guerras, Guerra Fria)",
      "Geografia Física e Cartografia",
      "Geografia Agrária e Urbana",
      "Geopolítica e Globalização",
      "Meio Ambiente e Questões Socioambientais",
      "Sociologia (Cidadania, Trabalho, Movimentos Sociais)",
      "Filosofia Antiga, Moderna e Contemporânea",
      "Formação Territorial e População do Brasil",
    ],
  },
  {
    id: "natureza",
    name: "Ciências da Natureza e suas Tecnologias",
    short: "Natureza",
    emoji: "🧪",
    topics: [
      "Mecânica (Cinemática e Dinâmica)",
      "Energia, Trabalho e Potência",
      "Termologia e Termodinâmica",
      "Óptica e Ondulatória",
      "Eletrodinâmica e Circuitos Elétricos",
      "Eletromagnetismo",
      "Química Geral e Atomística",
      "Estequiometria e Soluções",
      "Termoquímica, Cinética e Equilíbrio",
      "Eletroquímica",
      "Química Orgânica (Funções e Reações)",
      "Citologia e Biologia Celular",
      "Genética e Biotecnologia",
      "Ecologia e Impactos Ambientais",
      "Fisiologia Humana e Saúde",
      "Evolução e Origem da Vida",
    ],
  },
];

export const ENEM_AREA_NAMES = ENEM_AREAS.map((a) => a.name);

export function getArea(name: string): EnemArea | undefined {
  return ENEM_AREAS.find((a) => a.name === name || a.id === name);
}

export function areaShort(name: string): string {
  return getArea(name)?.short ?? name;
}

export function areaEmoji(name: string): string {
  return getArea(name)?.emoji ?? "📚";
}

export function topicsFor(areaName: string): string[] {
  return getArea(areaName)?.topics ?? [];
}

// Datas prováveis do ENEM 2026 (2º e 3º domingos de novembro — padrão das
// últimas edições). Editável nos Ajustes quando sair o edital oficial.
export const DEFAULT_ENEM_DATES = ["2026-11-08", "2026-11-15"];
