// Gera o catálogo ESTÁTICO de questões do ENEM em public/catalogo/ a partir do
// dump classificado em scripts/.data/. O catálogo é somente-leitura, versionado
// junto com o código, servido de public/ e cacheado pelo service worker — nunca
// entra no localStorage inteiro nem sobe para o Realtime Database.
//
// Uso:  node scripts/build-catalog.mjs
//
// Saída:
//   public/catalogo/meta.json         { anos, contagens, geradoEm }
//   public/catalogo/index.json        [{ id, area, year, topic, difficulty, img }]  (leve)
//   public/catalogo/<area>.json       questões completas daquela área
//
// IDs são derivados de ano + número da questão (enem-<ano>-<índice>[-en]) e são
// ESTÁVEIS entre reimportações — attempts/favorites/reviewedAt dependem disso.

import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "scripts", ".data");
const SRC = existsSync(path.join(DIR, "enem-classified.json"))
  ? path.join(DIR, "enem-classified.json")
  : path.join(DIR, "enem-raw.json");
const OUT = path.join(process.cwd(), "public", "catalogo");

// Conjunto canônico de áreas — o MESMO de src/lib/enem.ts. A API do enem.dev
// devolve os slugs `ciencias-humanas` / `ciencias-natureza`; o dump usa o nome
// completo. Aqui normalizamos tudo para o slug curto, uma única vez.
const AREA_ID = {
  "Matemática e suas Tecnologias": "matematica",
  "Linguagens, Códigos e suas Tecnologias": "linguagens",
  "Ciências Humanas e suas Tecnologias": "humanas",
  "Ciências da Natureza e suas Tecnologias": "natureza",
  matematica: "matematica",
  linguagens: "linguagens",
  humanas: "humanas",
  natureza: "natureza",
  "ciencias-humanas": "humanas",
  "ciencias-natureza": "natureza",
};
const AREA_IDS = ["matematica", "linguagens", "humanas", "natureza"];

const YEAR_MIN = 2009;
const YEAR_MAX = 2023; // cobertura real confirmada em GET /v1/exams
const EXPECTED_MIN = 2400; // abaixo disso, falha alto em vez de gravar pela metade

function normOption(o) {
  return {
    letter: String(o?.letter || "").toUpperCase().slice(0, 1),
    text: String(o?.text ?? "").trim(),
  };
}

function normQuestion(q) {
  const area = AREA_ID[String(q.subject || "").trim()];
  const year = Number(q.year);
  const options = Array.isArray(q.options) ? q.options.map(normOption) : [];
  const rec = {
    id: String(q.id || "").trim(),
    area,
    year,
    topic: typeof q.topic === "string" ? q.topic.trim() : "",
    statement: String(q.statement ?? "").trim(),
    options,
    correctOption: String(q.correctOption || "").toUpperCase().slice(0, 1),
    source: String(q.source || `ENEM ${year}`),
  };
  if (q.difficulty === "facil" || q.difficulty === "media" || q.difficulty === "dificil") {
    rec.difficulty = q.difficulty;
  }
  if (q.imageUrl) rec.imageUrl = String(q.imageUrl);
  if (q.possiblyHasImage) rec.possiblyHasImage = true;
  return rec;
}

function valid(rec, problems) {
  if (!rec.id) return problems.push("sem id"), false;
  if (!AREA_IDS.includes(rec.area)) {
    problems.push(`${rec.id}: área fora do canônico (${JSON.stringify(rec.area)})`);
    return false;
  }
  if (!Number.isInteger(rec.year) || rec.year < YEAR_MIN || rec.year > YEAR_MAX) {
    problems.push(`${rec.id}: ano fora de ${YEAR_MIN}–${YEAR_MAX} (${rec.year})`);
    return false;
  }
  if (rec.statement.length < 20) return problems.push(`${rec.id}: enunciado curto`), false;
  if (rec.options.length < 4) return problems.push(`${rec.id}: <4 alternativas`), false;
  if (!/^[A-E]$/.test(rec.correctOption)) {
    return problems.push(`${rec.id}: gabarito inválido`), false;
  }
  return true;
}

async function main() {
  const raw = JSON.parse(await readFile(SRC, "utf8"));
  console.log(`fonte: ${path.relative(process.cwd(), SRC)} — ${raw.length} registros`);

  const problems = [];
  const byId = new Map();
  for (const q of raw) {
    const rec = normQuestion(q);
    if (!valid(rec, problems)) continue;
    // dedup por id — o fetch paginado repete os itens de borda (50, 100, …);
    // mantém a primeira ocorrência, prefere a que já tem assunto.
    const prev = byId.get(rec.id);
    if (!prev || (!prev.topic && rec.topic)) byId.set(rec.id, rec);
  }

  const list = [...byId.values()].sort(
    (a, b) => a.year - b.year || a.id.localeCompare(b.id, "en", { numeric: true }),
  );

  if (problems.length) {
    console.warn(`\n${problems.length} registro(s) descartado(s):`);
    for (const p of problems.slice(0, 20)) console.warn("  - " + p);
    if (problems.length > 20) console.warn(`  … +${problems.length - 20}`);
  }

  if (list.length < EXPECTED_MIN) {
    console.error(
      `\nABORTADO: só ${list.length} questões válidas (esperado ≥ ${EXPECTED_MIN}). ` +
        `Não vou gravar um catálogo pela metade.`,
    );
    process.exit(1);
  }

  // ---- escreve ----
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const byArea = Object.fromEntries(AREA_IDS.map((a) => [a, []]));
  for (const rec of list) byArea[rec.area].push(rec);
  for (const a of AREA_IDS) {
    await writeFile(path.join(OUT, `${a}.json`), JSON.stringify(byArea[a]));
  }

  const index = list.map((r) => ({
    id: r.id,
    area: r.area,
    year: r.year,
    topic: r.topic,
    ...(r.difficulty ? { difficulty: r.difficulty } : {}),
    ...(r.possiblyHasImage || r.imageUrl ? { img: 1 } : {}),
  }));
  await writeFile(path.join(OUT, "index.json"), JSON.stringify(index));

  const years = {};
  for (const r of list) years[r.year] = (years[r.year] || 0) + 1;
  const areas = Object.fromEntries(AREA_IDS.map((a) => [a, byArea[a].length]));
  const semAssunto = list.filter((r) => !r.topic).length;
  const comImagem = list.filter((r) => r.possiblyHasImage || r.imageUrl).length;
  const meta = {
    geradoEm: new Date().toISOString(),
    total: list.length,
    coberturaAnos: [YEAR_MIN, YEAR_MAX],
    anos: years,
    areas,
    semAssunto,
    comImagem,
  };
  await writeFile(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 2));

  // ---- relatório de conferência ----
  console.log("\n════════ catálogo gerado ════════");
  console.log(`total: ${list.length}`);
  console.log("por ano:");
  for (const y of Object.keys(years).sort()) console.log(`  ${y}: ${years[y]}`);
  console.log("por área:");
  for (const a of AREA_IDS) console.log(`  ${a}: ${areas[a]}`);
  console.log(`sem assunto classificado: ${semAssunto} (${Math.round((semAssunto / list.length) * 100)}%)`);
  console.log(`com imagem provável: ${comImagem}`);
  console.log(`\nescrito em ${path.relative(process.cwd(), OUT)}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
