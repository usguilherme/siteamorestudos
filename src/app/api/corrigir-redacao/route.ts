import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

function buildPrompt(tema: string, texto: string) {
  return `Você é um corretor experiente da redação do ENEM. Avalie a redação abaixo
seguindo EXATAMENTE a matriz de referência oficial. Seja rigoroso e específico:
aponte trechos reais do texto, não faça elogios genéricos.

Cada competência vale de 0 a 200, em múltiplos de 40 (0, 40, 80, 120, 160, 200).

- C1 Norma-padrão: gramática, ortografia, pontuação, concordância, regência, crase.
- C2 Tema e gênero: compreensão do recorte do tema; texto dissertativo-argumentativo;
  repertório sociocultural produtivo (não decorado nem cópia dos textos motivadores).
- C3 Argumentação: projeto de texto claro, argumentos autorais encadeados e aprofundados
  (causas/consequências), sem contradição.
- C4 Coesão: conectivos variados entre e dentro dos parágrafos; referenciação sem repetição.
- C5 Proposta de intervenção: ação + agente + meio/modo + finalidade + detalhamento,
  respeitando os direitos humanos e ligada ao problema discutido.

TEMA: "${tema}"

REDAÇÃO:
"""
${texto}
"""

Responda APENAS com JSON válido, sem markdown, neste formato:
{
 "c1": { "nota": 0, "comentario": "" },
 "c2": { "nota": 0, "comentario": "" },
 "c3": { "nota": 0, "comentario": "" },
 "c4": { "nota": 0, "comentario": "" },
 "c5": { "nota": 0, "comentario": "" },
 "total": 0,
 "resumo": "2-3 frases sobre o desempenho geral",
 "pontosFortes": ["", ""],
 "aMelhorar": ["", "", ""]
}
Regras: "total" = soma das 5 notas. Comentários de 1 a 3 frases, citando o texto.
Se a redação fugir do tema, C2 e C3 devem refletir isso. Português do Brasil.`;
}

function parseJSON(text: string): unknown {
  try {
    return JSON.parse(text.replace(/```json/gi, "").replace(/```/g, "").trim());
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        /* noop */
      }
    }
    return null;
  }
}

const clampNota = (n: unknown): number => {
  const v = Math.round(Number(n) / 40) * 40;
  return Math.max(0, Math.min(200, Number.isFinite(v) ? v : 0));
};

const asComp = (v: unknown) => {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    nota: clampNota(o.nota),
    comentario: typeof o.comentario === "string" ? o.comentario : "",
  };
};

const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 6) : [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tema = String(body?.tema ?? "").trim();
    const texto = String(body?.text ?? "").trim();

    if (texto.length < 200) {
      return NextResponse.json(
        { error: "Escreva pelo menos alguns parágrafos antes de pedir a correção." },
        { status: 400 },
      );
    }
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Correção por IA não configurada." }, { status: 500 });
    }

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Você corrige redações do ENEM e responde só JSON." },
        { role: "user", content: buildPrompt(tema || "Tema livre", texto) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseJSON(raw) as Record<string, unknown> | null;
    if (!parsed) throw new Error("Não consegui interpretar a correção. Tente de novo.");

    const c1 = asComp(parsed.c1);
    const c2 = asComp(parsed.c2);
    const c3 = asComp(parsed.c3);
    const c4 = asComp(parsed.c4);
    const c5 = asComp(parsed.c5);
    const total = c1.nota + c2.nota + c3.nota + c4.nota + c5.nota;

    return NextResponse.json({
      c1,
      c2,
      c3,
      c4,
      c5,
      total,
      resumo: typeof parsed.resumo === "string" ? parsed.resumo : "",
      pontosFortes: asList(parsed.pontosFortes),
      aMelhorar: asList(parsed.aMelhorar),
      model: MODEL,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Erro na correção." },
      { status: 500 },
    );
  }
}
