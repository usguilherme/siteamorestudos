import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Nenhum texto fornecido." },
        { status: 400 }
      );
    }

    const prompt = `
Analise o texto abaixo, que foi extraído de um PDF de exercícios.

Extraia todas as questões encontradas.

Retorne APENAS um JSON válido no seguinte formato:

{
  "questions": [
    {
      "statement": "Texto da questão",
      "options": [
        {
          "letter": "A",
          "text": "Alternativa A"
        },
        {
          "letter": "B",
          "text": "Alternativa B"
        },
        {
          "letter": "C",
          "text": "Alternativa C"
        },
        {
          "letter": "D",
          "text": "Alternativa D"
        },
        {
          "letter": "E",
          "text": "Alternativa E"
        }
      ],
      "correctOption": "A"
    }
  ]
}

Regras:

- Não escreva markdown.
- Não use \`\`\`json.
- Retorne somente o JSON.
- Se a questão for dissertativa, deixe:
  "options": []
  "correctOption": ""

Texto:

${text.slice(0, 15000)}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = result.text ?? "";

    const cleaned = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) {
      return NextResponse.json(
        {
          error: "A IA não retornou um JSON válido.",
          raw: responseText,
        },
        { status: 500 }
      );
    }

    const data = JSON.parse(match[0]);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error?.message ??
          "Erro desconhecido ao processar o PDF.",
      },
      { status: 500 }
    );
  }
}