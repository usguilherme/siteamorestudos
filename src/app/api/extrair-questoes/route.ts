import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Nenhum texto fornecido." }, { status: 400 });
    }

    // Usando o modelo correto e estável
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analise o texto extraído de um PDF de exercícios abaixo e extraia as questões de forma estruturada.
      Retorne APENAS um objeto JSON válido (sem blocos de código markdown adicionais se possível, ou apenas em JSON puro) no seguinte formato exato:
      {
        "questions": [
          {
            "statement": "Texto do enunciado da questão",
            "options": [
              { "letter": "A", "text": "Texto da alternativa A" },
              { "letter": "B", "text": "Texto da alternativa B" },
              { "letter": "C", "text": "Texto da alternativa C" },
              { "letter": "D", "text": "Texto da alternativa D" },
              { "letter": "E", "text": "Texto da alternativa E" }
            ],
            "correctOption": "A"
          }
        ]
      }
      Se a questão for dissertativa ou não tiver alternativas de múltipla escolha, crie alternativas simuladas baseadas na resposta ou deixe as alternativas em branco, mas mantenha o formato do JSON.

      Texto para analisar:
      ${text.slice(0, 15000)}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Limpa possíveis marcações de markdown da resposta do Gemini
    const cleanedJsonText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(cleanedJsonText);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro na API de extração:", error);
    return NextResponse.json(
      { error: `Erro ao processar com a inteligência artificial: ${error.message}` },
      { status: 500 }
    );
  }
}