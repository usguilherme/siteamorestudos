import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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
      "correctOption": ""
    }
  ]
}

Regras:

- Retorne APENAS JSON.
- Não escreva explicações.
- Não utilize markdown.
- Não utilize \`\`\`.
- Se uma questão não possuir alternativas, utilize:
  "options": []
  "correctOption": ""

Texto:

${text.slice(0, 15000)}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente especializado em extrair questões de provas e retornar apenas JSON válido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      completion.choices[0]?.message?.content ?? "";

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
    console.error("Erro na API:", error);

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