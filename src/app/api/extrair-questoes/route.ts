import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Inicializa o SDK do Google Gen AI utilizando a chave de ambiente GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TOPICS_BY_SUBJECT = `
- Matemática e suas Tecnologias: Conjuntos Numéricos, Razão e Proporção, Porcentagem, Regra de Três (simples e composta), Progressões Aritméticas e Geométricas, Funções (1º grau, 2º grau, exponencial, logarítmica, modular), Matemática Financeira (juros simples e compostos), Análise Combinatória, Probabilidade, Estatística (medidas de tendência central e dispersão, leitura de gráficos e tabelas), Geometria Plana (áreas e perímetros), Geometria Espacial (volumes e áreas de sólidos), Geometria Analítica, Trigonometria (triângulo retângulo e ciclo trigonométrico), Sistemas Lineares, Matrizes e Determinantes.
- Linguagens, Códigos e suas Tecnologias: Interpretação de Texto, Gêneros e Tipos Textuais, Funções da Linguagem, Figuras de Linguagem, Coesão e Coerência Textual, Variação Linguística e Norma Culta, Fonética e Fonologia, Morfologia (classes de palavras), Sintaxe (concordância, regência, crase, período composto), Semântica, Literatura - Estilos de Época (Trovadorismo, Classicismo, Barroco, Arcadismo, Romantismo, Realismo/Naturalismo, Parnasianismo, Simbolismo, Pré-Modernismo, Modernismo, Literatura Contemporânea), Artes e História da Arte, Educação Física e Corpo/Saúde, Tecnologias da Informação e Comunicação, Compreensão de Texto em Língua Estrangeira (Inglês/Espanhol).
- Ciências Humanas e suas Tecnologias: História do Brasil (Colônia, Império, República, Ditadura Militar, Redemocratização), História Geral (Antiguidade Clássica, Idade Média, Idade Moderna, Revoluções Industriais, Guerras Mundiais, Guerra Fria), Geografia Física (Climatologia, Relevo, Hidrografia, Biomas), Geografia Humana e Econômica (Urbanização, Demografia, Industrialização, Agropecuária), Geopolítica e Globalização, Sociologia (Trabalho, Cultura, Movimentos Sociais, Desigualdade), Filosofia (Filosofia Antiga, Moderna e Contemporânea, Ética, Política), Cidadania, Direitos Humanos e Legislação, Meio Ambiente e Sustentabilidade.
- Ciências da Natureza e suas Tecnologias: Física - Mecânica (cinemática, dinâmica, estática, energia), Física - Termologia, Física - Óptica, Física - Ondulatória e Acústica, Física - Eletromagnetismo (eletrostática, eletrodinâmica, circuitos), Física Moderna, Química Geral (estrutura atômica, tabela periódica, ligações químicas), Físico-Química (termoquímica, cinética, equilíbrio químico, eletroquímica), Química Orgânica, Química Ambiental, Biologia - Citologia e Bioquímica, Biologia - Genética e Evolução, Biologia - Ecologia e Meio Ambiente, Biologia - Fisiologia Humana, Biologia - Botânica e Zoologia, Microbiologia e Saúde.
`;

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
    2. topic: O assunto específico da questão. Classifique usando, sempre que possível, um dos assuntos já consagrados no ENEM, listados abaixo por área. Se a questão não se encaixar perfeitamente em nenhum, escolha o mais próximo semanticamente em vez de criar um nome genérico novo:
    ${TOPICS_BY_SUBJECT}
    3. statement: O enunciado completo da questão.
    4. options: Um array com exatamente 5 alternativas de "A" a "E", contendo os campos "letter" ("A", "B", "C", "D", "E") e "text" (o texto da alternativa).
    5. correctOption: A letra correspondente à alternativa correta ("A", "B", "C", "D" ou "E"). Se o gabarito não estiver explícito no texto, deduza a resposta correta com base no conteúdo científico da questão.

    Retorne APENAS um array JSON válido contendo os objetos estruturados, sem nenhum texto adicional ou bloco de markdown fora do JSON.

    Texto para análise:
    ${text}
    `;

    // Utiliza o modelo gemini-3.5-flash: versão estável (GA) mais recente,
    // já que gemini-2.5-flash está sendo descontinuado e gemini-1.5/2.0
    // já foram desligados pelo Google
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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