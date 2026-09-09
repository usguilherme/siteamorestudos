// Importa o banco de questões do ENEM (2009+) da API pública api.enem.dev
// (dados abertos, licença GPL-2.0) para o Realtime Database do app.
//
// Uso:
//   node --env-file=.env.local scripts/import-enem.mjs fetch      # baixa da API
//   node --env-file=.env.local scripts/import-enem.mjs classify   # tópicos via Groq
//   node --env-file=.env.local scripts/import-enem.mjs push        # envia pro RTDB
//   node --env-file=.env.local scripts/import-enem.mjs all
//
// Os passos são retomáveis: cada um grava um arquivo em scripts/.data/.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const API = "https://api.enem.dev/v1";
const RTDB = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_CLASSIFY_MODEL || "openai/gpt-oss-20b";

const DIR = path.join(process.cwd(), "scripts", ".data");
const RAW = path.join(DIR, "enem-raw.json");
const CLASSIFIED = path.join(DIR, "enem-classified.json");

const AREA = {
  linguagens: "Linguagens, Códigos e suas Tecnologias",
  "ciencias-humanas": "Ciências Humanas e suas Tecnologias",
  "ciencias-natureza": "Ciências da Natureza e suas Tecnologias",
  matematica: "Matemática e suas Tecnologias",
};

const TOPICS = {
  "Matemática e suas Tecnologias": [
    "Aritmética e Operações Básicas", "Razão, Proporção e Regra de Três",
    "Porcentagem e Matemática Financeira", "Estatística (Média, Mediana, Moda e Desvio)",
    "Grandezas e Medidas", "Geometria Plana", "Geometria Espacial", "Geometria Analítica",
    "Funções (Afim, Quadrática, Exponencial e Logarítmica)", "Progressões (PA e PG)",
    "Trigonometria", "Análise Combinatória e Probabilidade", "Matrizes e Sistemas Lineares",
  ],
  "Linguagens, Códigos e suas Tecnologias": [
    "Interpretação e Compreensão de Textos", "Funções da Linguagem", "Variação Linguística",
    "Figuras de Linguagem", "Gêneros Textuais e Tipologia", "Gramática e Norma-Padrão",
    "Literatura Brasileira", "Modernismo e Vanguardas Artísticas", "Artes, Música e Cultura",
    "Educação Física e Corpo", "Língua Estrangeira (Inglês/Espanhol)",
    "Tecnologias da Informação e Comunicação",
  ],
  "Ciências Humanas e suas Tecnologias": [
    "História do Brasil Colônia", "Brasil Império",
    "Brasil República (Velha, Vargas, Militar, Nova República)",
    "História Geral (Antiga, Medieval, Moderna)",
    "História Contemporânea (Guerras, Guerra Fria)", "Geografia Física e Cartografia",
    "Geografia Agrária e Urbana", "Geopolítica e Globalização",
    "Meio Ambiente e Questões Socioambientais",
    "Sociologia (Cidadania, Trabalho, Movimentos Sociais)",
    "Filosofia Antiga, Moderna e Contemporânea", "Formação Territorial e População do Brasil",
  ],
  "Ciências da Natureza e suas Tecnologias": [
    "Mecânica (Cinemática e Dinâmica)", "Energia, Trabalho e Potência",
    "Termologia e Termodinâmica", "Óptica e Ondulatória",
    "Eletrodinâmica e Circuitos Elétricos", "Eletromagnetismo",
    "Química Geral e Atomística", "Estequiometria e Soluções",
    "Termoquímica, Cinética e Equilíbrio", "Eletroquímica",
    "Química Orgânica (Funções e Reações)", "Citologia e Biologia Celular",
    "Genética e Biotecnologia", "Ecologia e Impactos Ambientais",
    "Fisiologia Humana e Saúde", "Evolução e Origem da Vida",
  ],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await sleep(3000 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }
  throw new Error(`falhou após ${tries} tentativas: ${url}`);
}

function cleanContext(ctx) {
  if (!ctx) return "";
  return ctx
    .replace(/!\[[^\]]*\]\([^)]*broken-image[^)]*\)/g, "[figura]")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "[figura]")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mapQuestion(q) {
  const subject = AREA[q.discipline] || "";
  const ctx = cleanContext(q.context);
  const intro = (q.alternativesIntroduction || "").trim();
  const statement = [ctx, intro].filter(Boolean).join("\n\n");
  const files = Array.isArray(q.files) ? q.files.filter((f) => f && !/broken-image/.test(f)) : [];
  const options = (q.alternatives || []).map((a) => ({
    letter: a.letter,
    text: (a.text || "").trim() || (a.file ? "(alternativa em imagem — veja a figura)" : ""),
  }));
  const hasImg =
    files.length > 0 ||
    /\[figura\]/.test(statement) ||
    (q.alternatives || []).some((a) => a.file);

  return {
    id: `enem-${q.year}-${q.index}${q.language === "ingles" ? "-en" : ""}`,
    subject,
    topic: "",
    statement,
    options,
    correctOption: q.correctAlternative || "",
    year: q.year,
    imageUrl: files[0] || undefined,
    possiblyHasImage: hasImg || undefined,
    source: `ENEM ${q.year}`,
    createdAt: new Date(`${q.year}-11-01`).toISOString(),
  };
}

async function phaseFetch() {
  await mkdir(DIR, { recursive: true });
  const exams = await getJSON(`${API}/exams`);
  const years = exams.map((e) => e.year).sort();
  console.log("Provas:", years.join(", "));

  const all = [];
  for (const year of years) {
    let offset = 0;
    let total = Infinity;
    const before = all.length;
    while (offset < total) {
      const page = await getJSON(`${API}/exams/${year}/questions?limit=50&offset=${offset}`);
      total = page.metadata.total;
      for (const q of page.questions) {
        if (q.language === "espanhol") continue; // mantém só null / inglês
        const m = mapQuestion(q);
        if (m.subject && m.statement.length > 30 && m.options.length >= 4 && m.correctOption) {
          all.push(m);
        }
      }
      offset += 50;
      await sleep(1100); // respeita ~10 req / 10 s
    }
    console.log(`${year}: +${all.length - before} (total ${all.length})`);
  }
  await writeFile(RAW, JSON.stringify(all));
  console.log(`\n${all.length} questões salvas em ${RAW}`);
}

// Classificador por palavras-chave (rápido, offline, ~bom o bastante).
const KEYWORDS = {
  "Razão, Proporção e Regra de Três": ["proporc", "proporcional", "regra de tr", "razão", "escala", "diretamente", "inversamente", "velocidade média", "densidade demográfica"],
  "Porcentagem e Matemática Financeira": ["por cento", "porcentagem", "%", "desconto", "acréscimo", "juro", "lucro", "prejuízo", "taxa de", "inflação", "parcela", "à vista", "financ"],
  "Estatística (Média, Mediana, Moda e Desvio)": ["média", "mediana", "moda", "desvio", "amostra", "frequência", "histograma", "pesquisa", "dados da tabela", "gráfico de barras", "percentil", "quartil"],
  "Grandezas e Medidas": ["quilômetro", "metro", "litro", "hectare", "vazão", "escala de", "unidade de medida", "converter", "km/h", "m/s", "toneladas"],
  "Geometria Plana": ["área", "perímetro", "triângulo", "quadrado", "retângulo", "círculo", "circunferência", "polígono", "pitágoras", "trapézio", "losango", "ângulo", "semelhança"],
  "Geometria Espacial": ["volume", "cilindro", "esfera", "cubo", "prisma", "pirâmide", "cone", "capacidade", "paralelepípedo", "aresta", "m³", "litros de água"],
  "Geometria Analítica": ["plano cartesiano", "coordenada", "reta que passa", "distância entre os pontos", "equação da reta", "ponto médio"],
  "Funções (Afim, Quadrática, Exponencial e Logarítmica)": ["função", "f(x)", "gráfico da função", "parábola", "vértice", "logaritmo", "exponencial", "crescimento", "modelo matemático", "expressa por", "domínio", "y ="],
  "Progressões (PA e PG)": ["progressão", "razão da sequência", "termo da sequência", "sequência numérica", "primeiro termo"],
  "Trigonometria": ["seno", "cosseno", "tangente", "radiano", "trigonom", "ângulo de elevação", "hipotenusa", "cateto"],
  "Análise Combinatória e Probabilidade": ["probabilidade", "chance", "combinaç", "arranjo", "permutaç", "possibilidades", "sorteio", "ao acaso", "aleatório", "quantas maneiras", "quantos anagramas"],
  "Matrizes e Sistemas Lineares": ["matriz", "sistema de equações", "determinante"],

  "Interpretação e Compreensão de Textos": ["o texto", "de acordo com o texto", "no texto", "autor", "crônica", "reportagem", "notícia", "editorial", "leitura do texto", "finalidade do texto", "tema abordado"],
  "Funções da Linguagem": ["função da linguagem", "função referencial", "função emotiva", "função apelativa", "função poética", "função fática", "função metalinguística", "predomina a função"],
  "Variação Linguística": ["variação linguística", "variedade", "norma-padrão", "norma culta", "coloquial", "regionalismo", "preconceito linguístico", "gíria", "informalidade", "registro"],
  "Figuras de Linguagem": ["metáfora", "metonímia", "hipérbole", "ironia", "eufemismo", "personificação", "prosopopeia", "antítese", "figura de linguagem", "aliteração"],
  "Gêneros Textuais e Tipologia": ["gênero textual", "gênero do discurso", "tipo textual", "dissertativo", "narrativo", "injuntivo", "propaganda", "anúncio", "charge", "tirinha", "cartum", "infográfico"],
  "Gramática e Norma-Padrão": ["concordância", "regência", "crase", "coesão", "conectivo", "pronome", "oração", "sujeito", "predicado", "conjugação", "acentuação"],
  "Literatura Brasileira": ["romantismo", "realismo", "naturalismo", "parnasianismo", "simbolismo", "barroco", "arcadismo", "machado de assis", "josé de alencar", "castro alves", "poema de", "soneto", "eu lírico"],
  "Modernismo e Vanguardas Artísticas": ["modernismo", "semana de arte moderna", "vanguarda", "cubismo", "futurismo", "surrealismo", "manifesto", "mário de andrade", "oswald de andrade", "antropofag", "drummond", "22"],
  "Artes, Música e Cultura": ["pintura", "escultura", "obra de arte", "artista plástico", "música", "canção", "melodia", "ritmo", "dança", "teatro", "cultura popular", "patrimônio cultural", "grafite"],
  "Educação Física e Corpo": ["esporte", "atividade física", "exercício físico", "jogos olímpicos", "ginástica", "sedentarismo", "modalidade esportiva", "capacidade física", "treinamento"],
  "Língua Estrangeira (Inglês/Espanhol)": ["the text", "according to the text", "the author", "in the text", "el texto", "según el texto", "de acuerdo con el texto"],
  "Tecnologias da Informação e Comunicação": ["internet", "rede social", "redes sociais", "aplicativo", "digital", "algoritmo", "inteligência artificial", "computador", "tecnologia da informação", "meio digital"],

  "História do Brasil Colônia": ["colônia", "colonial", "capitanias", "pau-brasil", "engenho", "escravidão indígena", "jesuítas", "bandeirantes", "período colonial", "sesmaria", "pacto colonial"],
  "Brasil Império": ["dom pedro", "d. pedro", "império", "primeiro reinado", "segundo reinado", "regência", "independência do brasil", "1822", "1889", "abolição", "lei áurea", "guerra do paraguai"],
  "Brasil República (Velha, Vargas, Militar, Nova República)": ["república", "getúlio vargas", "estado novo", "coronelismo", "café com leite", "ditadura militar", "ai-5", "golpe de 1964", "redemocratização", "constituição de 1988", "era vargas", "clt", "tenentismo", "canudos"],
  "História Geral (Antiga, Medieval, Moderna)": ["grécia antiga", "roma antiga", "idade média", "feudalismo", "renascimento", "reforma protestante", "absolutismo", "revolução francesa", "iluminismo", "mesopotâmia", "egito antigo", "cruzadas"],
  "História Contemporânea (Guerras, Guerra Fria)": ["primeira guerra", "segunda guerra", "guerra fria", "nazismo", "fascismo", "holocausto", "revolução russa", "muro de berlim", "guerra mundial", "eua e urss", "descolonização", "imperialismo"],
  "Geografia Física e Cartografia": ["relevo", "clima", "bioma", "vegetação", "hidrografia", "placas tectônicas", "coordenadas geográficas", "projeção cartográfica", "fuso horário", "latitude", "longitude", "solo", "intemperismo"],
  "Geografia Agrária e Urbana": ["agronegócio", "reforma agrária", "êxodo rural", "urbanização", "metrópole", "favela", "cidade", "agricultura familiar", "latifúndio", "conurbação", "rede urbana", "espaço agrário"],
  "Geopolítica e Globalização": ["globalização", "blocos econômicos", "mercosul", "união europeia", "multinacional", "geopolítica", "fluxos de capital", "nova ordem mundial", "brics", "onu", "guerra comercial"],
  "Meio Ambiente e Questões Socioambientais": ["desmatamento", "aquecimento global", "efeito estufa", "sustentável", "sustentabilidade", "poluição", "amazônia", "recursos hídricos", "impacto ambiental", "queimadas", "desenvolvimento sustentável", "acordo de paris"],
  "Sociologia (Cidadania, Trabalho, Movimentos Sociais)": ["durkheim", "weber", "karl marx", "fato social", "movimento social", "classe social", "trabalho", "cidadania", "sindicato", "desigualdade social", "indústria cultural", "sociedade de consumo", "mais-valia", "alienação"],
  "Filosofia Antiga, Moderna e Contemporânea": ["sócrates", "platão", "aristóteles", "descartes", "kant", "nietzsche", "foucault", "hannah arendt", "filósofo", "filosofia", "contrato social", "hobbes", "rousseau", "locke", "ética", "razão", "epicur", "estoic"],
  "Formação Territorial e População do Brasil": ["território brasileiro", "fronteira", "migração interna", "pirâmide etária", "densidade demográfica", "população brasileira", "transição demográfica", "regiões do brasil", "ibge"],

  "Mecânica (Cinemática e Dinâmica)": ["velocidade", "aceleração", "movimento uniforme", "queda livre", "força resultante", "leis de newton", "atrito", "deslocamento", "trajetória", "m/s²", "plano inclinado", "colisão", "quantidade de movimento", "impulso"],
  "Energia, Trabalho e Potência": ["energia cinética", "energia potencial", "trabalho de uma força", "potência", "conservação de energia", "rendimento", "kwh", "joule", "watt", "energia mecânica"],
  "Termologia e Termodinâmica": ["temperatura", "calor", "dilatação", "calor específico", "calor latente", "termodinâmica", "escala celsius", "kelvin", "equilíbrio térmico", "condução", "convecção", "caloria", "máquina térmica"],
  "Óptica e Ondulatória": ["luz", "espelho", "lente", "refração", "reflexão", "onda", "frequência", "comprimento de onda", "som", "espectro", "imagem formada", "índice de refração", "efeito doppler"],
  "Eletrodinâmica e Circuitos Elétricos": ["corrente elétrica", "tensão", "resistência", "circuito", "lei de ohm", "resistor", "voltagem", "amperes", "watts", "potência elétrica", "ddp", "curto-circuito", "chuveiro elétrico"],
  "Eletromagnetismo": ["campo magnético", "ímã", "indução eletromagnética", "força magnética", "eletroímã", "gerador", "transformador", "bobina", "linhas de campo"],
  "Química Geral e Atomística": ["átomo", "próton", "nêutron", "elétron", "número atômico", "tabela periódica", "ligação iônica", "ligação covalente", "isótopo", "distribuição eletrônica", "modelo atômico", "eletronegatividade"],
  "Estequiometria e Soluções": ["mol", "massa molar", "estequiometria", "concentração", "solução aquosa", "diluição", "reagente limitante", "balanceamento", "número de avogadro", "molaridade", "g/l", "cnpt", "rendimento da reação"],
  "Termoquímica, Cinética e Equilíbrio": ["entalpia", "reação exotérmica", "reação endotérmica", "energia de ativação", "velocidade da reação", "catalisador", "equilíbrio químico", "constante de equilíbrio", "le chatelier", "δh"],
  "Eletroquímica": ["pilha", "bateria", "eletrólise", "oxidação", "redução", "oxirredução", "nox", "ânodo", "cátodo", "potencial de redução", "corrosão", "ferrugem"],
  "Química Orgânica (Funções e Reações)": ["carbono", "cadeia carbônica", "hidrocarboneto", "álcool", "ácido carboxílico", "éster", "cetona", "aldeído", "amina", "polímero", "isomeria", "orgânica", "hidroxila", "reação de adição", "combustão", "petróleo", "biodiesel", "etanol"],
  "Citologia e Biologia Celular": ["célula", "membrana plasmática", "mitocôndria", "cloroplasto", "núcleo", "ribossomo", "organela", "osmose", "citoplasma", "procarionte", "eucarionte", "fotossíntese", "respiração celular", "mitose", "meiose"],
  "Genética e Biotecnologia": ["gene", "alelo", "dna", "cromossomo", "hereditariedade", "mendel", "heredograma", "genótipo", "fenótipo", "dominante", "recessivo", "transgênico", "clonagem", "mutação", "código genético"],
  "Ecologia e Impactos Ambientais": ["cadeia alimentar", "teia alimentar", "ecossistema", "população", "comunidade", "nicho ecológico", "ciclo do carbono", "ciclo do nitrogênio", "eutrofização", "bioacumulação", "biodiversidade", "sucessão ecológica", "níveis tróficos", "espécie invasora"],
  "Fisiologia Humana e Saúde": ["digestão", "circulação", "sistema nervoso", "hormônio", "insulina", "vacina", "soro", "anticorpo", "sistema imune", "rim", "pulmão", "alvéolo", "pressão arterial", "doença", "epidemia", "antibiótico"],
  "Evolução e Origem da Vida": ["evolução", "seleção natural", "darwin", "lamarck", "adaptação", "ancestral comum", "fóssil", "especiação", "deriva genética", "origem da vida"],
};

function classifyByKeywords(all) {
  let hit = 0;
  for (const q of all) {
    if (q.topic) { hit++; continue; }
    const topics = TOPICS[q.subject] || [];
    const txt = q.statement.toLowerCase();
    let best = "";
    let bestScore = 0;
    for (const t of topics) {
      const kws = KEYWORDS[t] || [];
      let score = 0;
      for (const kw of kws) {
        if (txt.includes(kw)) score += kw.length > 6 ? 2 : 1;
      }
      if (score > bestScore) { bestScore = score; best = t; }
    }
    if (bestScore >= 2) { q.topic = best; hit++; }
  }
  return hit;
}

async function classifyBatch(subject, batch) {
  const list = TOPICS[subject];
  const numbered = list.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const qs = batch
    .map((q, i) => `[${i}] ${q.statement.slice(0, 550).replace(/\n+/g, " ")}`)
    .join("\n\n");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Você classifica questões do ENEM por assunto. Responda só JSON.",
        },
        {
          role: "user",
          content: `Área: ${subject}\n\nAssuntos possíveis:\n${numbered}\n\nClassifique cada questão no assunto mais adequado (use o NÚMERO). Se nenhum servir, use 0.\n\nQuestões:\n${qs}\n\nResponda: {"r":[{"i":0,"t":<número>}, ...]}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw.replace(/```json/gi, "").replace(/```/g, "").trim());
  const arr = Array.isArray(parsed.r) ? parsed.r : [];
  for (const { i, t } of arr) {
    const idx = Number(i);
    const tn = Number(t);
    if (batch[idx] && tn >= 1 && tn <= list.length) {
      batch[idx].topic = list[tn - 1];
    }
  }
}

async function phaseClassify() {
  const src = existsSync(CLASSIFIED) ? CLASSIFIED : RAW;
  const all = JSON.parse(await readFile(src, "utf8"));

  const hit = classifyByKeywords(all);
  await writeFile(CLASSIFIED, JSON.stringify(all));
  console.log(`Classificação por palavras-chave: ${hit}/${all.length} com assunto.`);

  // Passo opcional com IA só para as que sobraram (se pedido e a API deixar).
  if (process.argv.includes("--ai") && GROQ_KEY) {
    const pending = all.filter((q) => !q.topic);
    console.log(`Tentando IA em ${pending.length} restantes…`);
    const bySubject = {};
    for (const q of pending) (bySubject[q.subject] ||= []).push(q);
    let done = 0;
    for (const [subject, arr] of Object.entries(bySubject)) {
      for (let i = 0; i < arr.length; i += 20) {
        const batch = arr.slice(i, i + 20);
        for (let a = 0; a < 5; a++) {
          try {
            await classifyBatch(subject, batch);
            break;
          } catch (e) {
            if (String(e.message).includes("429")) await sleep(8000 * (a + 1));
            else break;
          }
        }
        done += batch.length;
        if (done % 100 < 20) {
          await writeFile(CLASSIFIED, JSON.stringify(all));
          console.log(`  IA ${done}/${pending.length}`);
        }
        await sleep(4000);
      }
    }
    await writeFile(CLASSIFIED, JSON.stringify(all));
  }

  const semTopico = all.filter((q) => !q.topic).length;
  console.log(`Concluído. Sem assunto: ${semTopico}/${all.length}.`);
}

async function phasePush() {
  if (!RTDB) throw new Error("NEXT_PUBLIC_FIREBASE_DATABASE_URL ausente");
  const src = existsSync(CLASSIFIED) ? CLASSIFIED : RAW;
  const imported = JSON.parse(await readFile(src, "utf8"));

  const current = await getJSON(`${RTDB}/valessa/questions.json`);
  const existing = Array.isArray(current?.list) ? current.list : [];
  const byId = new Map(existing.map((q) => [q.id, q]));
  for (const q of imported) byId.set(q.id, { ...byId.get(q.id), ...q });

  const list = [...byId.values()];
  const payload = { list, updatedAt: Date.now() };

  const res = await fetch(`${RTDB}/valessa/questions.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`PUT ${res.status} ${await res.text()}`);

  await writeFile(
    path.join(DIR, "enem-backup.json"),
    JSON.stringify({ questions: list }, null, 0),
  );
  console.log(`${list.length} questões no RTDB (${imported.length} importadas).`);
}

const cmd = process.argv[2] || "all";
if (cmd === "fetch" || cmd === "all") await phaseFetch();
if (cmd === "classify" || cmd === "all") await phaseClassify();
if (cmd === "push" || cmd === "all") await phasePush();
