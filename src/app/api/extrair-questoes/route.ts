import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


const MAX_TEXT_PER_BATCH = 5000;



function normalizeText(text:string){

  return text
    .replace(/\r\n/g,"\n")
    .replace(/\r/g,"\n")
    .replace(/\u00A0/g," ")
    .replace(/--- Página \d+ ---/gi,"")
    .trim();

}




function splitQuestions(text:string){

  const cleaned = normalizeText(text);


  const regex =
    /(?=\n?\s*(?:QUEST[ÃA]O\s*)?\d{1,3}\s*[\.\)\-:])/gi;



  const questions =
    cleaned
    .split(regex)
    .map(q=>q.trim())
    .filter(q=>q.length > 40);



  console.log(
    "Questões encontradas:",
    questions.length
  );



  if(questions.length > 0){

    return questions;

  }



  return [cleaned];

}




function createBatches(chunks:string[]){

  const batches:string[]=[];

  let current="";



  for(const chunk of chunks){


    if(
      current.length + chunk.length >
      MAX_TEXT_PER_BATCH
    ){

      if(current.trim()){
        batches.push(current.trim());
      }


      current="";

    }


    current += chunk + "\n\n";

  }



  if(current.trim()){
    batches.push(current.trim());
  }



  return batches;

}




function buildPrompt(text:string){

return `

Você é um sistema especializado em extrair questões de provas.

Analise o texto abaixo e encontre todas as questões.

IMPORTANTE:

- O texto pode estar desformatado.
- As alternativas podem estar quebradas em linhas diferentes.
- Pode existir somente uma questão.
- Nunca retorne lista vazia se existir um enunciado de questão.

Retorne APENAS JSON válido.

Formato obrigatório:

{
 "questions":[
  {
   "statement":"",
   "options":[
    {
     "letter":"A",
     "text":""
    }
   ],
   "correctOption":"",
   "explanation":"",
   "possiblyHasImage":false
  }
 ]
}


Regras:

- Não use markdown.
- Não escreva explicações.
- Não invente texto.
- Preserve o texto original.
- Se não existir alternativa, use options [].
- Se depender de imagem/gráfico/tabela, possiblyHasImage=true.
- Se não souber a resposta, deixe correctOption vazio.
- Se o texto trouxer a resolução/comentário da questão, resuma em explanation; senão deixe "".


Texto:

${text}

`;

}




function parseJSON(text:string){

  try{

    return JSON.parse(
      text
      .replace(/```json/g,"")
      .replace(/```/g,"")
      .trim()
    );


  }catch{


    const match =
      text.match(/\{[\s\S]*\}/);


    if(match){

      try{

        return JSON.parse(match[0]);

      }catch{}

    }


    return null;

  }

}





async function extractBatch(
  text:string,
  index:number
){

try{


const completion =
await groq.chat.completions.create({

model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

temperature:0,

max_tokens:8000,

response_format:{
 type:"json_object"
},


messages:[

{
role:"system",
content:
"Extraia questões de provas retornando somente JSON."
},


{
role:"user",
content:
buildPrompt(text)
}

]


});




const output =
completion
.choices[0]
?.message
?.content ?? "";



console.log(
`Lote ${index+1}:`,
output.substring(0,300)
);




const json =
parseJSON(output);



if(
json &&
Array.isArray(json.questions)
){

return json.questions;

}



return [];



}catch(error){


console.error(
"Lote com erro:",
index+1,
(error as Error).message
);


return [];

}


}






export async function POST(
req:NextRequest
){


try{


const body =
await req.json();



const text =
body.text;



if(
!text ||
typeof text !== "string"
){

return NextResponse.json(
{
error:"Texto vazio"
},
{
status:400
}
);

}




console.log(
"Tamanho texto:",
text.length
);




const chunks =
splitQuestions(text);



console.log(
"Chunks:",
chunks.length
);




const batches =
createBatches(chunks);



console.log(
"Batches:",
batches.length
);




const questions:unknown[]=[];




for(
let i=0;
i<batches.length;
i++
){


const result =
await extractBatch(
batches[i],
i
);



questions.push(
...result
);


}





console.log(
"TOTAL EXTRAÍDO:",
questions.length
);





return NextResponse.json({

questions,

totalBatches:
batches.length,

totalQuestionsExtracted:
questions.length

});





}catch(error){


console.error(error);



return NextResponse.json(
{
error:
(error as Error).message ??
"Erro interno"
},
{
status:500
}
);


}


}