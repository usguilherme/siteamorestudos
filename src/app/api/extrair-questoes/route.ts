import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Quantas questões mandar por chamada à IA.
// Números menores = mais confiável, porém mais chamadas (mais lento).
// Números maiores = mais rápido, porém mais risco de a IA "cortar" o JSON.
const QUESTIONS_PER_BATCH = 8;

interface ExtractedOption {
  letter: string;
  text: string;
}

interface ExtractedQuestion {
  statement: string;
  options: ExtractedOption[];
  correctOption: string;
  possiblyHasImage?: boolean;
}

/**
 * Divide o texto bruto do PDF em blocos, um por questão.
 * Reconhece padrões comuns de numeração: "1.", "1)", "01.", "Questão 1", etc.
 * no início da linha.
 */
function splitIntoQuestionChunks(text: string): string[] {
  // Normaliza quebras de linha
  const normalized = text.replace(/\r\n/g, "\n");

  // Regex que identifica o início de uma nova questão:
  // início de linha + número (1-3 dígitos) + "." ou ")" + espaço
  const questionStartRegex = /(?=^\s*\d{1,3}[.\)]\s)/gm;

  const rawChunks = normalized
    .split(questionStartRegex)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  // Se a regex não encontrou nada (texto não numerado do jeito esperado),
  // devolve o texto inteiro como um único chunk — melhor tentar do que falhar.
  if (rawChunks.length <= 1) {
    return [normalized.trim()];
  }

  return rawChunks;
}

/**
 * Agrupa os chunks de questão em lotes de N questões,
 * respeitando um limite aproximado de caracteres por lote também,
 * para não estourar o contexto do modelo em questões muito longas.
 */
function groupIntoBatches(
  chunks: string[],
  questionsPerBatch: number,
  maxCharsPerBatch = 12000
): string[] {
  const batches: string[] = [];
  let currentBatch: string[] = [];
  let currentChars = 0;

  for (const chunk of chunks) {
    const wouldExceedCount = currentBatch.length >= questionsPerBatch;
    const wouldExceedChars = currentChars + chunk.length > maxCharsPerBatch;

    if (currentBatch.length > 0 && (wouldExceedCount || wouldExceedChars)) {
      batches.push(currentBatch.join("\n\n"));
      currentBatch = [];
      currentChars = 0;
    }

    currentBatch.push(chunk);
    currentChars += chunk.length;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch.join("\n\n"));
  }

  return batches;
}

function buildPrompt(batchText: string): string {
  return `
Analise o texto abaixo, extraído de um PDF de exercícios.

Extraia TODAS as questões encontradas neste trecho (pode haver mais de uma).

Retorne APENAS um JSON válido no seguinte formato:

{
  "questions": [
    {
      "statement": "Texto da questão",
      "options": [
        { "letter": "A", "text": "Alternativa A" },
        { "letter": "B", "text": "Alternativa B" },
        { "letter": "C", "text": "Alternativa C" },
        { "letter": "D", "text": "Alternativa D" },
        { "letter": "E", "text": "Alternativa E" }
      ],
      "correctOption": "",
      "possiblyHasImage": false
    }
  ]
}

Regras:
- Retorne APENAS JSON, nada de texto explicativo, nada de markdown, nada de \`\`\`.
- Se uma questão não possuir alternativas, use "options": [] e "correctOption": "".
- Se o enunciado mencionar, descrever ou depender de uma figura, gráfico, tabela,
  imagem, estrutura química ou fórmula que não está representada em texto simples
  (ex: "conforme a figura abaixo", "observe o gráfico", desenhos de moléculas),
  marque "possiblyHasImage": true. Isso é importante para revisão manual depois.
- Não invente questões que não estão no texto. Não invente alternativas.
- Preserve o enunciado o mais fiel possível ao texto original.

Texto:

${batchText}
`;
}

/**
 * Extrai o primeiro objeto JSON válido de uma string,
 * removendo eventuais marcações de markdown que a IA tenha adicionado.
 */
function extractJson(raw: string): any | null {
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function processBatch(
  batchText: string,
  batchIndex: number
): Promise<{ questions: ExtractedQuestion[]; error?: string }> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente especializado em extrair questões de provas e retornar apenas JSON válido, sem nenhum texto adicional.",
        },
        {
          role: "user",
          content: buildPrompt(batchText),
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content ?? "";
    const data = extractJson(responseText);

    if (!data || !Array.isArray(data.questions)) {
      return {
        questions: [],
        error: `Lote ${batchIndex + 1}: a IA não retornou um JSON válido.`,
      };
    }

    return { questions: data.questions as ExtractedQuestion[] };
  } catch (error: any) {
    return {
      questions: [],
      error: `Lote ${batchIndex + 1}: ${error?.message ?? "erro desconhecido"}`,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Nenhum texto fornecido." },
        { status: 400 }
      );
    }

    const chunks = splitIntoQuestionChunks(text);
    const batches = groupIntoBatches(chunks, QUESTIONS_PER_BATCH);

    if (batches.length === 0) {
      return NextResponse.json(
        { error: "Não foi possível dividir o texto em questões." },
        { status: 400 }
      );
    }

    const allQuestions: ExtractedQuestion[] = [];
    const warnings: string[] = [];

    // Processa os lotes em sequência (evita estourar rate limit da API).
    // Se quiser mais velocidade e o seu plano da Groq aguentar,
    // dá pra trocar por Promise.all — mas em sequência é mais seguro.
    for (let i = 0; i < batches.length; i++) {
      const result = await processBatch(batches[i], i);
      allQuestions.push(...result.questions);
      if (result.error) warnings.push(result.error);
    }

    return NextResponse.json({
      questions: allQuestions,
      totalBatches: batches.length,
      totalQuestionsExtracted: allQuestions.length,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error: any) {
    console.error("Erro na API de extração:", error);
    return NextResponse.json(
      { error: error?.message ?? "Erro desconhecido ao processar o PDF." },
      { status: 500 }
    );
  }
}