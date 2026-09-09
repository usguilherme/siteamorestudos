// Mensagens de incentivo. Tom carinhoso e leve — é a plataforma de estudos da
// Valessa, feita com amor. `{name}` é trocado pelo nome definido nos Ajustes.

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

function fill(template: string, name: string): string {
  return template.replaceAll("{name}", name || "amor");
}

const CORRECT = [
  "Isso, {name}! 💛",
  "Acertou, {name}! Tô orgulhoso de você.",
  "Mandou bem demais! 🌟",
  "É essa mente brilhante que eu amo. ✨",
  "Perfeito, {name}! Continua assim.",
  "Boaaa! Uma a menos pra prova. 💪",
];

const WRONG = [
  "Calma, {name}. Errar agora é acertar na prova. 💛",
  "Tá tudo bem, {name}. Respira e entende o porquê.",
  "Essa foi difícil. Você consegue a próxima. 🤍",
  "Errou? Ótimo, agora você nunca mais esquece. 😉",
  "Sem crise, {name}. Um passo de cada vez.",
  "Eu acredito em você, mesmo quando a questão não colabora. 💛",
];

const GOAL_DONE = [
  "Meta do dia batida, {name}! Você é incrível. 🎯💛",
  "Cumpriu a meta de hoje! Orgulho define. ✨",
  "Missão do dia concluída, {name}. Descansa que você merece.",
  "Meta batida! Cada dia desses te aproxima da aprovação. 🚀",
];

const STREAK = [
  "{name}, você já são {days} dias seguidos estudando! 🔥",
  "{days} dias de sequência. Disciplina de aprovada. 💛",
  "Sequência de {days} dias! Não para agora, {name}.",
];

const SESSION_GREAT = [
  "Simulado fechado com chave de ouro, {name}! 🌟",
  "Que desempenho, {name}! A aprovação tá chegando.",
  "Você arrasou nesse simulado. 💛",
];

const SESSION_OK = [
  "Bom trabalho, {name}. Agora revisa os erros com carinho.",
  "Cada simulado desses te deixa mais pronta, {name}. 💪",
  "Feito! O importante é a constância, e você tem. 💛",
];

const SESSION_HARD = [
  "Simulado puxado, né {name}? O crescimento vem daqui. 🤍",
  "Não foi o melhor resultado, mas foi coragem de tentar. Bora revisar juntos.",
  "{name}, respira. Esse simulado mostrou exatamente o que treinar.",
];

export const messages = {
  correct: (name: string) => fill(pick(CORRECT), name),
  wrong: (name: string) => fill(pick(WRONG), name),
  goalDone: (name: string) => fill(pick(GOAL_DONE), name),
  streak: (name: string, days: number) =>
    fill(pick(STREAK), name).replaceAll("{days}", String(days)),
  session: (name: string, accuracy: number) => {
    if (accuracy >= 75) return fill(pick(SESSION_GREAT), name);
    if (accuracy >= 50) return fill(pick(SESSION_OK), name);
    return fill(pick(SESSION_HARD), name);
  },
};

export function greeting(name: string): string {
  const h = new Date().getHours();
  const period = h < 6 ? "Boa madrugada" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return name ? `${period}, ${name}` : period;
}
