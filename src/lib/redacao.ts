// Conteúdo de apoio à redação do ENEM. Estático — não depende de rede.

export interface Competencia {
  id: "c1" | "c2" | "c3" | "c4" | "c5";
  numero: number;
  titulo: string;
  resumo: string;
  derruba: string[]; // o que costuma derrubar a nota
}

export const COMPETENCIAS: Competencia[] = [
  {
    id: "c1",
    numero: 1,
    titulo: "Domínio da norma-padrão",
    resumo:
      "Escrever segundo a gramática e a ortografia oficiais: concordância, regência, crase, pontuação, acentuação.",
    derruba: [
      "Vírgula separando sujeito de verbo",
      "Crase antes de palavra masculina ou de verbo",
      "'Mim fazer', 'a nível de', 'onde' para coisas não-lugares",
      "Períodos gigantes sem pontuação",
      "Erros de ortografia recorrentes (mais/mas, a/há, senão/se não)",
    ],
  },
  {
    id: "c2",
    numero: 2,
    titulo: "Compreensão do tema e do gênero",
    resumo:
      "Entender exatamente o que foi pedido e produzir um texto dissertativo-argumentativo — com repertório sociocultural produtivo, não decorado.",
    derruba: [
      "Fugir do tema ou tangenciar (falar do assunto geral, não do recorte)",
      "Colar um repertório que não conversa com o argumento ('repertório de enfeite')",
      "Fazer texto narrativo ou poético em vez de dissertativo",
      "Copiar trechos dos textos motivadores",
    ],
  },
  {
    id: "c3",
    numero: 3,
    titulo: "Seleção e organização dos argumentos",
    resumo:
      "Defender um ponto de vista com argumentos autorais, encadeados e aprofundados — cada parágrafo puxando o próximo.",
    derruba: [
      "Parágrafos soltos, sem projeto de texto",
      "Só constatar o problema, sem explicar causas e consequências",
      "Contradição entre a tese e a proposta de intervenção",
      "Argumento por senso comum ('desde os primórdios', 'infelizmente')",
    ],
  },
  {
    id: "c4",
    numero: 4,
    titulo: "Coesão (conectivos e referenciação)",
    resumo:
      "Amarrar o texto com conectivos variados entre parágrafos e dentro deles, e retomar termos sem repetir palavras.",
    derruba: [
      "Começar todo parágrafo com 'Além disso'",
      "Repetir a mesma palavra-chave o tempo todo (sem pronome/sinônimo)",
      "Conectivo que não combina com a relação lógica ('portanto' sem causa antes)",
      "Parágrafo sem nenhum elemento coesivo com o anterior",
    ],
  },
  {
    id: "c5",
    numero: 5,
    titulo: "Proposta de intervenção",
    resumo:
      "Propor uma solução para o problema, detalhada e respeitando os direitos humanos, com os 5 elementos.",
    derruba: [
      "Faltar um dos 5 elementos (ação, agente, meio/modo, finalidade, detalhamento)",
      "Proposta genérica ('o governo deve investir em educação')",
      "Proposta que fere direitos humanos (punições cruéis, censura)",
      "Proposta desconectada do problema discutido no texto",
    ],
  },
];

export const PROPOSTA_ELEMENTOS = [
  { nome: "Ação", desc: "O que deve ser feito" },
  { nome: "Agente", desc: "Quem faz (Ministério, escolas, mídia, ONGs, família…)" },
  { nome: "Meio / modo", desc: "Como será feito" },
  { nome: "Finalidade / efeito", desc: "Para quê — o resultado esperado" },
  { nome: "Detalhamento", desc: "Um exemplo ou explicação a mais de qualquer elemento" },
];

export const ESTRUTURA = [
  {
    parte: "Introdução",
    linhas: "≈ 4–6 linhas",
    passos: [
      "Contextualização: repertório que apresenta o tema (fato histórico, dado, obra, lei)",
      "Apresentação do problema (o recorte específico do tema)",
      "Tese: seu ponto de vista + antecipação dos 2 argumentos",
    ],
  },
  {
    parte: "Desenvolvimento 1",
    linhas: "≈ 6–8 linhas",
    passos: [
      "Tópico frasal: o primeiro argumento em uma frase",
      "Repertório sociocultural que sustenta o argumento",
      "Explicação: causas e/ou consequências, com raciocínio autoral",
      "Fechamento que conecta com o próximo parágrafo",
    ],
  },
  {
    parte: "Desenvolvimento 2",
    linhas: "≈ 6–8 linhas",
    passos: [
      "Tópico frasal do segundo argumento (outra perspectiva)",
      "Novo repertório (não repetir o do D1)",
      "Aprofundamento com dados, comparação ou relação de causa e efeito",
    ],
  },
  {
    parte: "Conclusão",
    linhas: "≈ 5–7 linhas",
    passos: [
      "Retomada da tese (com outras palavras)",
      "Proposta de intervenção com os 5 elementos",
      "Frase de fechamento que amarra tudo",
    ],
  },
];

export interface TemaPassado {
  ano: number;
  tema: string;
  aplicacao?: string; // regular, reaplicação, digital, PPL
}

export const TEMAS_PASSADOS: TemaPassado[] = [
  { ano: 2024, tema: "Desafios para a valorização da herança africana no Brasil" },
  { ano: 2023, tema: "Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil" },
  { ano: 2022, tema: "Desafios para a valorização de comunidades e povos tradicionais no Brasil" },
  { ano: 2021, tema: "Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil" },
  { ano: 2020, tema: "O estigma associado às doenças mentais na sociedade brasileira" },
  { ano: 2019, tema: "Democratização do acesso ao cinema no Brasil" },
  { ano: 2018, tema: "Manipulação do comportamento do usuário pelo controle de dados na internet" },
  { ano: 2017, tema: "Desafios para a formação educacional de surdos no Brasil" },
  { ano: 2016, tema: "Caminhos para combater a intolerância religiosa no Brasil" },
  { ano: 2015, tema: "A persistência da violência contra a mulher na sociedade brasileira" },
  { ano: 2014, tema: "Publicidade infantil em questão no Brasil" },
  { ano: 2013, tema: "Efeitos da implantação da Lei Seca no Brasil" },
  { ano: 2012, tema: "O movimento imigratório para o Brasil no século XXI" },
  { ano: 2011, tema: "Viver em rede no século XXI: os limites entre o público e o privado" },
];

export const TEMAS_PROVAVEIS: string[] = [
  "Impactos da inteligência artificial no mundo do trabalho no Brasil",
  "Desafios para o enfrentamento da desinformação nas redes sociais",
  "Combate ao etarismo e valorização da pessoa idosa no Brasil",
  "Caminhos para a universalização do saneamento básico no Brasil",
  "A saúde mental da juventude brasileira",
  "Insegurança alimentar e o direito à alimentação no Brasil",
  "Desafios para a inclusão de pessoas com deficiência no mercado de trabalho",
  "Preservação de línguas indígenas como patrimônio cultural brasileiro",
  "O combate à evasão escolar no ensino médio",
  "Adaptação das cidades brasileiras às mudanças climáticas",
  "Trabalho análogo à escravidão no Brasil contemporâneo",
  "Desafios para a valorização do professor da educação básica no Brasil",
];

export interface RepertorioItem {
  tipo: "Filósofo / Sociólogo" | "Lei / Documento" | "Dado / Fato" | "Obra / Cultura";
  ref: string;
  uso: string;
}

export interface RepertorioEixo {
  eixo: string;
  emoji: string;
  itens: RepertorioItem[];
}

export const REPERTORIO: RepertorioEixo[] = [
  {
    eixo: "Cidadania e direitos",
    emoji: "⚖️",
    itens: [
      { tipo: "Lei / Documento", ref: "Constituição de 1988, art. 5º", uso: "Igualdade de todos perante a lei; usar quando um grupo é tratado de forma desigual." },
      { tipo: "Lei / Documento", ref: "Declaração Universal dos Direitos Humanos (1948)", uso: "Dignidade como valor universal; base para propostas que não podem feri-la." },
      { tipo: "Filósofo / Sociólogo", ref: "Hannah Arendt — 'direito a ter direitos'", uso: "Quando há populações invisíveis ao Estado (sem registro, sem acesso)." },
      { tipo: "Filósofo / Sociólogo", ref: "T. H. Marshall — cidadania civil, política e social", uso: "Mostrar que garantir o direito no papel não basta sem efetivação social." },
    ],
  },
  {
    eixo: "Tecnologia e informação",
    emoji: "💻",
    itens: [
      { tipo: "Filósofo / Sociólogo", ref: "Zygmunt Bauman — 'modernidade líquida'", uso: "Relações e informações efêmeras; superficialidade no consumo de conteúdo." },
      { tipo: "Lei / Documento", ref: "LGPD (Lei 13.709/2018) e Marco Civil da Internet", uso: "Proteção de dados; regulação do ambiente digital em propostas de intervenção." },
      { tipo: "Obra / Cultura", ref: "Documentário 'O Dilema das Redes' (2020)", uso: "Algoritmos que exploram a atenção e reforçam bolhas e desinformação." },
      { tipo: "Filósofo / Sociólogo", ref: "Pierre Lévy — 'inteligência coletiva'", uso: "Potencial positivo da rede quando bem usada — contraponto otimista." },
    ],
  },
  {
    eixo: "Meio ambiente",
    emoji: "🌱",
    itens: [
      { tipo: "Lei / Documento", ref: "Acordo de Paris (2015) e ODS da ONU (Agenda 2030)", uso: "Compromissos ambientais que o Brasil assinou e nem sempre cumpre." },
      { tipo: "Dado / Fato", ref: "Cerca de 35 milhões de brasileiros sem acesso a água tratada (SNIS)", uso: "Saneamento, desigualdade socioambiental." },
      { tipo: "Filósofo / Sociólogo", ref: "Ailton Krenak — 'Ideias para adiar o fim do mundo'", uso: "Crítica à ideia de humanidade separada da natureza; povos tradicionais." },
      { tipo: "Obra / Cultura", ref: "Encíclica 'Laudato Si' (2015)", uso: "'Ecologia integral' — meio ambiente ligado à justiça social." },
    ],
  },
  {
    eixo: "Educação",
    emoji: "📚",
    itens: [
      { tipo: "Lei / Documento", ref: "LDB (Lei 9.394/96) e art. 205 da Constituição", uso: "Educação como direito de todos e dever do Estado e da família." },
      { tipo: "Filósofo / Sociólogo", ref: "Paulo Freire — 'educação como prática da liberdade'", uso: "Educação que forma cidadãos críticos, não só mão de obra." },
      { tipo: "Dado / Fato", ref: "PNAD: milhões de jovens de 15–17 anos fora da escola", uso: "Evasão escolar, desigualdade de acesso." },
      { tipo: "Filósofo / Sociólogo", ref: "Bernard Charlot — 'relação com o saber'", uso: "Por que o aluno não vê sentido na escola." },
    ],
  },
  {
    eixo: "Saúde",
    emoji: "🏥",
    itens: [
      { tipo: "Lei / Documento", ref: "SUS — Lei 8.080/90; saúde como direito universal", uso: "Base para propostas de ampliação de acesso." },
      { tipo: "Filósofo / Sociólogo", ref: "Michel Foucault — 'biopoder'", uso: "Controle dos corpos; estigmatização de doentes mentais e dependentes." },
      { tipo: "Dado / Fato", ref: "OMS: transtornos mentais entre as principais causas de afastamento do trabalho", uso: "Saúde mental como questão coletiva, não individual." },
      { tipo: "Obra / Cultura", ref: "Filme 'Bicho de Sete Cabeças' (2000)", uso: "Crítica ao modelo manicomial; luta antimanicomial." },
    ],
  },
  {
    eixo: "Trabalho e desigualdade",
    emoji: "💼",
    itens: [
      { tipo: "Filósofo / Sociólogo", ref: "Karl Marx — divisão do trabalho e alienação", uso: "Precarização, trabalho sem reconhecimento." },
      { tipo: "Filósofo / Sociólogo", ref: "Silvia Federici — trabalho de cuidado não remunerado", uso: "Sobrecarga histórica das mulheres com o cuidado." },
      { tipo: "Dado / Fato", ref: "IBGE: mulheres negras têm os menores rendimentos médios do país", uso: "Interseccionalidade entre raça, gênero e classe." },
      { tipo: "Lei / Documento", ref: "CLT e Convenções da OIT sobre trabalho decente", uso: "Referência para propostas de fiscalização e formalização." },
    ],
  },
];
