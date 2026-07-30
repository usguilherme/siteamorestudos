import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Inicializa o SDK do Google Gen AI utilizando a chave de ambiente GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "O texto bruto do PDF é obrigatório." },
        { status: 400 }
      );
    }

    const prompt = `
    Analise o texto extraído de uma prova escolar ou do ENEM abaixo e extraia todas as questões encontradas.
    Para cada questão, identifique obrigatoriamente:
    1. subject: A grande área (use exatamente uma destas: "Matemática e suas Tecnologias", "Linguagens, Códigos e suas Tecnologias", "Ciências Humanas e suas Tecnologias" ou "Ciências da Natureza e suas Tecnologias").
    2. topic: O assunto específico da questão (ex: Razão e Proporção, Geometria Plana, Funções, Mecânica, História do Brasil, etc.).
    3. statement: O enunciado completo da questão.
    4. options: Um array com exatamente 5 alternativas de "A" a "E", contendo os campos "letter" ("A", "B", "C", "D", "E") e "text" (o texto da alternativa).
    5. correctOption: A letra correspondente à alternativa correta ("A", "B", "C", "D" ou "E"). Se o gabarito não estiver explícito no texto, deduza a resposta correta com base no conteúdo científico da questão.

    Retorne APENAS um array JSON válido contendo os objetos estruturados, sem nenhum texto adicional ou bloco de markdown fora do JSON.

    Texto para análise:
    ${text}
    `;

    // Utiliza o modelo gemini-2.5-flash para processamento rápido de texto e estruturação
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawResponseText = response.text || "[]";
    
    // Remove eventuais marcações de bloco de código markdown que a IA possa retornar
    const cleanedJsonText = rawResponseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const questions = JSON.parse(cleanedJsonText);

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    console.error("Erro ao extrair questões com IA:", error);
    return NextResponse.json(
      { error: "Erro ao processar as questões com a inteligência artificial: " + error.message },
      { status: 500 }
    );
  }
}