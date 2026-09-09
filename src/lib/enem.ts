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

export const ALL_TOPICS: string[] = ENEM_AREAS.flatMap((a) => a.topics);

// Datas prováveis do ENEM 2026 (2º e 3º domingos de novembro — padrão das
// últimas edições). Editável nos Ajustes quando sair o edital oficial.
export const DEFAULT_ENEM_DATES = ["2026-11-08", "2026-11-15"];

// Índice de incidência: estimativa de quantas das últimas ~10 provas cada
// assunto apareceu com peso relevante (0 = raro, 10 = cai todo ano).
// Baseado no padrão histórico do ENEM — é aproximação, não contagem oficial.
export const INCIDENCE: Record<string, number> = {
  // Matemática
  "Aritmética e Operações Básicas": 9,
  "Razão, Proporção e Regra de Três": 10,
  "Porcentagem e Matemática Financeira": 10,
  "Estatística (Média, Mediana, Moda e Desvio)": 9,
  "Grandezas e Medidas": 8,
  "Geometria Plana": 9,
  "Geometria Espacial": 8,
  "Geometria Analítica": 5,
  "Funções (Afim, Quadrática, Exponencial e Logarítmica)": 9,
  "Progressões (PA e PG)": 5,
  "Trigonometria": 4,
  "Análise Combinatória e Probabilidade": 8,
  "Matrizes e Sistemas Lineares": 3,
  // Linguagens
  "Interpretação e Compreensão de Textos": 10,
  "Funções da Linguagem": 7,
  "Variação Linguística": 8,
  "Figuras de Linguagem": 6,
  "Gêneros Textuais e Tipologia": 7,
  "Gramática e Norma-Padrão": 5,
  "Literatura Brasileira": 7,
  "Modernismo e Vanguardas Artísticas": 6,
  "Artes, Música e Cultura": 6,
  "Educação Física e Corpo": 6,
  "Língua Estrangeira (Inglês/Espanhol)": 10,
  "Tecnologias da Informação e Comunicação": 6,
  // Humanas
  "História do Brasil Colônia": 6,
  "Brasil Império": 5,
  "Brasil República (Velha, Vargas, Militar, Nova República)": 9,
  "História Geral (Antiga, Medieval, Moderna)": 6,
  "História Contemporânea (Guerras, Guerra Fria)": 7,
  "Geografia Física e Cartografia": 8,
  "Geografia Agrária e Urbana": 8,
  "Geopolítica e Globalização": 8,
  "Meio Ambiente e Questões Socioambientais": 9,
  "Sociologia (Cidadania, Trabalho, Movimentos Sociais)": 9,
  "Filosofia Antiga, Moderna e Contemporânea": 8,
  "Formação Territorial e População do Brasil": 6,
  // Natureza
  "Mecânica (Cinemática e Dinâmica)": 9,
  "Energia, Trabalho e Potência": 9,
  "Termologia e Termodinâmica": 7,
  "Óptica e Ondulatória": 7,
  "Eletrodinâmica e Circuitos Elétricos": 9,
  "Eletromagnetismo": 5,
  "Química Geral e Atomística": 7,
  "Estequiometria e Soluções": 8,
  "Termoquímica, Cinética e Equilíbrio": 7,
  "Eletroquímica": 6,
  "Química Orgânica (Funções e Reações)": 9,
  "Citologia e Biologia Celular": 7,
  "Genética e Biotecnologia": 8,
  "Ecologia e Impactos Ambientais": 10,
  "Fisiologia Humana e Saúde": 8,
  "Evolução e Origem da Vida": 6,
};

export function incidenceOf(topic: string): number {
  return INCIDENCE[topic] ?? 5;
}

export function incidenceLabel(n: number): string {
  if (n >= 9) return "cai quase todo ano";
  if (n >= 7) return "cai com frequência";
  if (n >= 4) return "cai às vezes";
  return "cai raramente";
}
