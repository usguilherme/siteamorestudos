// Resumos de 1 tela dos assuntos que mais caem. Conteúdo direto: o essencial,
// as fórmulas, a pegadinha clássica e um exemplo rápido.

export interface Resumo {
  topic: string; // deve bater com um assunto de enem.ts
  area: string;
  essencial: string[];
  formulas?: { label: string; expr: string }[];
  pega: string;
  exemplo: string;
}

export const RESUMOS: Resumo[] = [
  {
    topic: "Razão, Proporção e Regra de Três",
    area: "Matemática e suas Tecnologias",
    essencial: [
      "Razão é a divisão entre duas grandezas; proporção é a igualdade entre duas razões.",
      "Regra de três direta: as grandezas crescem juntas. Inversa: uma cresce, a outra diminui.",
      "Sempre escreva as unidades e alinhe grandezas iguais na mesma coluna.",
    ],
    formulas: [
      { label: "Proporção", expr: "a/b = c/d  →  a·d = b·c (produto dos meios = produto dos extremos)" },
      { label: "Escala", expr: "escala = distância no mapa ÷ distância real" },
    ],
    pega: "Antes de multiplicar em cruz, decida se a regra é direta ou inversa. Na inversa, você inverte uma das frações.",
    exemplo:
      "4 pedreiros levam 9 dias. Quantos dias 6 pedreiros levam? Mais pedreiros → menos dias (inversa): 4·9 = 6·x → x = 6 dias.",
  },
  {
    topic: "Porcentagem e Matemática Financeira",
    area: "Matemática e suas Tecnologias",
    essencial: [
      "x% = x/100. 'De' significa multiplicação.",
      "Aumento de p%: multiplica por (1 + p/100). Desconto de p%: multiplica por (1 − p/100).",
      "Aumentos/descontos sucessivos se MULTIPLICAM, não se somam.",
    ],
    formulas: [
      { label: "Juros simples", expr: "J = C·i·t   (montante M = C + J)" },
      { label: "Juros compostos", expr: "M = C·(1 + i)^t" },
    ],
    pega: "Subir 20% e depois cair 20% NÃO volta ao valor original: 1,2 · 0,8 = 0,96 → perda de 4%.",
    exemplo:
      "Produto de R$ 200 com dois descontos de 10%: 200 · 0,9 · 0,9 = R$ 162 (não R$ 160).",
  },
  {
    topic: "Estatística (Média, Mediana, Moda e Desvio)",
    area: "Matemática e suas Tecnologias",
    essencial: [
      "Média: soma ÷ quantidade. Sensível a valores extremos.",
      "Mediana: valor central com os dados ORDENADOS (média dos dois centrais se n for par).",
      "Moda: o(s) valor(es) que mais aparece(m). Pode não existir ou haver mais de uma.",
      "Desvio-padrão maior = dados mais espalhados em torno da média.",
    ],
    formulas: [
      { label: "Média ponderada", expr: "(x₁·p₁ + x₂·p₂ + …) ÷ (p₁ + p₂ + …)" },
    ],
    pega: "Para mediana e moda os dados PRECISAM estar ordenados. E leia se o gráfico traz frequência absoluta ou relativa (%).",
    exemplo:
      "Notas 4, 6, 6, 8, 10: média = 6,8; mediana = 6; moda = 6.",
  },
  {
    topic: "Geometria Plana",
    area: "Matemática e suas Tecnologias",
    essencial: [
      "Áreas mais cobradas: retângulo (b·h), triângulo (b·h/2), círculo (π·r²), trapézio ((B+b)·h/2).",
      "Teorema de Pitágoras vale só em triângulo retângulo: a² = b² + c².",
      "Figuras semelhantes: lados proporcionais (razão k) e áreas na razão k².",
    ],
    formulas: [
      { label: "Circunferência", expr: "C = 2·π·r" },
      { label: "Setor circular", expr: "área = (α/360)·π·r²" },
    ],
    pega: "Ao dobrar os lados de uma figura, a área quadruplica (k²) e o volume octuplica (k³).",
    exemplo:
      "Terreno retangular 20 m × 15 m tem 300 m². Se cada lado dobra: 40 × 30 = 1200 m² (4×).",
  },
  {
    topic: "Geometria Espacial",
    area: "Matemática e suas Tecnologias",
    essencial: [
      "Volume do prisma/cilindro = área da base × altura.",
      "Volume da pirâmide/cone = (área da base × altura) ÷ 3.",
      "Esfera: V = (4/3)·π·r³.",
      "1 m³ = 1000 L. 1 L = 1 dm³ = 1000 cm³.",
    ],
    pega: "Conversão de unidade é o erro nº 1: capacidade em litros, dimensões em metros. Padronize tudo antes de calcular.",
    exemplo:
      "Caixa d'água 2 m × 1,5 m × 1 m = 3 m³ = 3000 L.",
  },
  {
    topic: "Funções (Afim, Quadrática, Exponencial e Logarítmica)",
    area: "Matemática e suas Tecnologias",
    essencial: [
      "Afim (y = ax + b): reta; a é a taxa de variação, b é onde corta o eixo y.",
      "Quadrática (y = ax² + bx + c): parábola; vértice em x = −b/2a; abre pra cima se a > 0.",
      "Exponencial (y = a·bˣ): crescimento/decaimento rápido (juros, população, meia-vida).",
    ],
    formulas: [
      { label: "Vértice (máx/mín)", expr: "x_v = −b/(2a)   e   y_v = −Δ/(4a)" },
      { label: "Raízes (Bhaskara)", expr: "x = (−b ± √Δ)/(2a),  Δ = b² − 4ac" },
    ],
    pega: "Interpretar o gráfico: onde a função é positiva/negativa, crescente/decrescente, e o que o coeficiente a representa no contexto.",
    exemplo:
      "Custo C(x) = 50 + 3x. A cada unidade a mais, o custo sobe R$ 3 (coeficiente a).",
  },
  {
    topic: "Análise Combinatória e Probabilidade",
    area: "Matemática e suas Tecnologias",
    essencial: [
      "Princípio multiplicativo: se uma etapa tem m opções e a outra n, o total é m·n.",
      "A ORDEM importa → arranjo/permutação. Não importa → combinação.",
      "Probabilidade = casos favoráveis ÷ casos possíveis (entre 0 e 1).",
    ],
    formulas: [
      { label: "Permutação", expr: "P(n) = n!" },
      { label: "Combinação", expr: "C(n,p) = n! / [p!·(n−p)!]" },
      { label: "Prob. de A ou B (mutuamente exclusivos)", expr: "P(A) + P(B)" },
    ],
    pega: "Pódio, senha e fila usam ARRANJO (ordem importa). Escolher uma comissão/grupo usa COMBINAÇÃO.",
    exemplo:
      "Escolher 2 pessoas entre 5 para uma dupla: C(5,2) = 10.",
  },
  {
    topic: "Grandezas e Medidas",
    area: "Matemática e suas Tecnologias",
    essencial: [
      "Comprimento: cada 'degrau' (km→m→cm→mm) multiplica/divide por 10.",
      "Área: cada degrau vale 100 (10²). Volume: cada degrau vale 1000 (10³).",
      "Velocidade média = distância ÷ tempo. Vazão = volume ÷ tempo.",
    ],
    pega: "1 hectare = 10 000 m². 1 tonelada = 1000 kg. km/h ÷ 3,6 = m/s.",
    exemplo:
      "Torneira de vazão 15 L/min enche um tanque de 300 L em 300 ÷ 15 = 20 min.",
  },
  {
    topic: "Mecânica (Cinemática e Dinâmica)",
    area: "Ciências da Natureza e suas Tecnologias",
    essencial: [
      "MRU: velocidade constante. MRUV: aceleração constante (queda livre, freada).",
      "2ª Lei de Newton: força resultante = massa × aceleração.",
      "No gráfico v × t, a área embaixo da curva é o deslocamento; a inclinação é a aceleração.",
    ],
    formulas: [
      { label: "MRUV", expr: "v = v₀ + a·t    e    S = S₀ + v₀·t + a·t²/2" },
      { label: "Torricelli", expr: "v² = v₀² + 2·a·ΔS" },
      { label: "Newton", expr: "F_res = m·a    (peso P = m·g)" },
    ],
    pega: "g ≈ 10 m/s². Na subida a gravidade desacelera (a = −10); no topo a velocidade é zero mas a aceleração NÃO.",
    exemplo:
      "Carro a 20 m/s freia a −4 m/s². Para em t = 20/4 = 5 s.",
  },
  {
    topic: "Energia, Trabalho e Potência",
    area: "Ciências da Natureza e suas Tecnologias",
    essencial: [
      "Energia se conserva: cinética ↔ potencial ↔ térmica. Ela transforma, não some.",
      "Trabalho é energia transferida por uma força ao longo de um deslocamento.",
      "Potência é a rapidez com que a energia é transferida (energia ÷ tempo).",
    ],
    formulas: [
      { label: "Cinética / Potencial", expr: "Ec = m·v²/2    Ep = m·g·h" },
      { label: "Trabalho / Potência", expr: "W = F·d·cosθ    P = W/t    P = U·i (elétrica)" },
      { label: "Energia elétrica", expr: "E = P·t   (kWh = kW × h → conta de luz)" },
    ],
    pega: "1 kWh = 3,6 milhões de joules. Rendimento = energia útil ÷ energia total (sempre < 100%).",
    exemplo:
      "Chuveiro de 5500 W ligado 20 min/dia gasta 5,5 · (1/3) ≈ 1,83 kWh por dia.",
  },
  {
    topic: "Eletrodinâmica e Circuitos Elétricos",
    area: "Ciências da Natureza e suas Tecnologias",
    essencial: [
      "Corrente (A) é fluxo de carga; tensão (V) é a 'pressão'; resistência (Ω) atrapalha a passagem.",
      "Série: mesma corrente, tensões somam, resistências somam.",
      "Paralelo: mesma tensão, correntes somam, resistência total menor que a menor.",
    ],
    formulas: [
      { label: "1ª Lei de Ohm", expr: "U = R·i" },
      { label: "Potência", expr: "P = U·i = R·i² = U²/R" },
    ],
    pega: "Aparelhos de casa ficam em PARALELO (todos com 127/220 V). Ler a potência e a tensão da etiqueta é o começo de quase toda questão.",
    exemplo:
      "Lâmpada '60 W / 120 V': corrente i = P/U = 60/120 = 0,5 A.",
  },
  {
    topic: "Termologia e Termodinâmica",
    area: "Ciências da Natureza e suas Tecnologias",
    essencial: [
      "Calor flui do corpo quente para o frio até o equilíbrio térmico.",
      "Calor sensível muda a temperatura; calor latente muda o estado físico (temperatura fica constante).",
      "Escalas: T(K) = T(°C) + 273.",
    ],
    formulas: [
      { label: "Calor sensível", expr: "Q = m·c·ΔT" },
      { label: "Calor latente", expr: "Q = m·L" },
      { label: "Dilatação linear", expr: "ΔL = L₀·α·ΔT" },
    ],
    pega: "Durante a fusão ou a ebulição a temperatura NÃO muda, mesmo recebendo calor.",
    exemplo:
      "Aquecer 200 g de água (c = 1 cal/g°C) de 20 °C a 80 °C: Q = 200 · 1 · 60 = 12 000 cal.",
  },
  {
    topic: "Química Orgânica (Funções e Reações)",
    area: "Ciências da Natureza e suas Tecnologias",
    essencial: [
      "Cadeia carbônica: identifique a função pelo grupo (–OH álcool, –COOH ácido, –CHO aldeído, C=O cetona, –O– éter, –NH₂ amina).",
      "Isomeria: mesma fórmula molecular, estruturas diferentes.",
      "Reações-chave: combustão, adição (em duplas), substituição, esterificação (ácido + álcool → éster + água).",
    ],
    pega: "Nomear: conte a maior cadeia com o grupo funcional, ache a posição do grupo e das ramificações. Prefixo = nº de carbonos (met, et, prop, but…).",
    exemplo:
      "Etanol (C₂H₆O) e metoximetano são isômeros: mesma fórmula, funções diferentes (álcool × éter).",
  },
  {
    topic: "Estequiometria e Soluções",
    area: "Ciências da Natureza e suas Tecnologias",
    essencial: [
      "Balanceie a equação primeiro. Os coeficientes dão a proporção em MOLS.",
      "1 mol = massa molar (g) = 6·10²³ partículas = 22,4 L de gás nas CNTP.",
      "Concentração comum: C = massa ÷ volume (g/L). Molaridade: M = mols ÷ volume (mol/L).",
    ],
    formulas: [
      { label: "Diluição", expr: "C₁·V₁ = C₂·V₂" },
      { label: "Mols", expr: "n = massa ÷ massa molar" },
    ],
    pega: "Reagente limitante: quem acaba primeiro determina o quanto de produto se forma. Sempre confira a proporção da equação balanceada.",
    exemplo:
      "Diluir 50 mL de solução 4 mol/L para 2 mol/L: V₂ = (4·50)/2 = 100 mL (adicionar 50 mL de água).",
  },
  {
    topic: "Genética e Biotecnologia",
    area: "Ciências da Natureza e suas Tecnologias",
    essencial: [
      "1ª Lei de Mendel: cada característica vem de um par de alelos que se separam nos gametas.",
      "Cruzamento Aa × Aa → 3 dominantes : 1 recessivo (1 AA : 2 Aa : 1 aa).",
      "Heredograma: quadrado = homem, círculo = mulher, símbolo preenchido = afetado.",
    ],
    pega: "Se dois pais NÃO afetados têm filho afetado, o gene é recessivo — e ambos os pais são Aa. Se está no X, atenção ao sexo.",
    exemplo:
      "Aa × aa: metade Aa (dominante), metade aa (recessivo) → 1 : 1.",
  },
  {
    topic: "Ecologia e Impactos Ambientais",
    area: "Ciências da Natureza e suas Tecnologias",
    essencial: [
      "Cadeia alimentar: produtor → consumidores → decompositor. A energia diminui a cada nível.",
      "Ciclos do carbono, nitrogênio e água conectam seres vivos e ambiente.",
      "Impactos clássicos: efeito estufa (CO₂, CH₄), eutrofização (excesso de nutrientes na água), bioacumulação (poluente concentra na cadeia).",
    ],
    pega: "Efeito estufa é natural e necessário; o problema é a INTENSIFICAÇÃO por queima de combustível fóssil. Não confunda com a camada de ozônio.",
    exemplo:
      "Agrotóxico lançado num lago se concentra mais no peixe grande (topo da cadeia) do que na água — bioacumulação.",
  },
  {
    topic: "Fisiologia Humana e Saúde",
    area: "Ciências da Natureza e suas Tecnologias",
    essencial: [
      "Digestório: quebra o alimento (enzimas) e absorve no intestino delgado.",
      "Circulatório: pequena circulação (coração ↔ pulmão, oxigena) e grande (coração ↔ corpo).",
      "Respiratório: troca gasosa nos alvéolos (entra O₂, sai CO₂).",
      "Excretor: rins filtram o sangue e formam a urina.",
    ],
    pega: "Vacina = imunização ATIVA (o corpo produz anticorpos, demora, dura). Soro = imunização PASSIVA (anticorpos prontos, age rápido, dura pouco).",
    exemplo:
      "Quem foi mordido por cobra recebe SORO antiofídico (efeito imediato), não vacina.",
  },
  {
    topic: "Interpretação e Compreensão de Textos",
    area: "Linguagens, Códigos e suas Tecnologias",
    essencial: [
      "A resposta está no texto: sublinhe tese, argumentos e a intenção do autor.",
      "Diferencie o que o texto DIZ (explícito) do que ele SUGERE (implícito/ironia).",
      "Cuidado com alternativas verdadeiras que NÃO respondem ao que foi perguntado.",
    ],
    pega: "Palavras como 'sempre', 'nunca', 'todos', 'apenas' costumam deixar a alternativa errada. Extrapolação (dizer mais do que o texto diz) também derruba.",
    exemplo:
      "Se a pergunta é sobre a 'finalidade' do texto, uma alternativa que resume o 'assunto' pode ser verdadeira e ainda assim errada.",
  },
  {
    topic: "Variação Linguística",
    area: "Linguagens, Códigos e suas Tecnologias",
    essencial: [
      "Não existe 'certo' e 'errado' absolutos: existe adequação ao contexto (formal × informal).",
      "Tipos: regional (sotaque), social, histórica, situacional.",
      "Preconceito linguístico é julgar a pessoa pela forma como fala.",
    ],
    pega: "O ENEM valoriza a diversidade: alternativas que tratam a fala popular como 'erro' ou 'inferior' quase sempre estão erradas.",
    exemplo:
      "'Nós vai' numa conversa informal cumpre a comunicação; num edital, não seria adequado. Contexto define.",
  },
  {
    topic: "Meio Ambiente e Questões Socioambientais",
    area: "Ciências Humanas e suas Tecnologias",
    essencial: [
      "Desenvolvimento sustentável: atender o presente sem comprometer as gerações futuras.",
      "No Brasil: desmatamento (Amazônia, Cerrado), conflitos por terra e água, matriz energética.",
      "Documentos: Agenda 2030/ODS, Acordo de Paris, Código Florestal.",
    ],
    pega: "Questão socioambiental junta natureza E sociedade: quem sofre mais os impactos costuma ser a população mais pobre e os povos tradicionais.",
    exemplo:
      "Hidrelétrica é energia 'limpa' em CO₂, mas alaga áreas, desloca comunidades e emite metano — o custo social entra na conta.",
  },
  {
    topic: "Sociologia (Cidadania, Trabalho, Movimentos Sociais)",
    area: "Ciências Humanas e suas Tecnologias",
    essencial: [
      "Durkheim: fato social, coesão, o que mantém a sociedade unida.",
      "Weber: ação social com sentido, burocracia, tipos de dominação.",
      "Marx: classes sociais, trabalho, mais-valia, alienação.",
      "Movimentos sociais lutam por direitos e reconhecimento (trabalhadores, mulheres, negros, LGBTQ+, sem-terra).",
    ],
    pega: "Associe o autor ao conceito: 'coerção externa' → Durkheim; 'desencantamento do mundo' → Weber; 'luta de classes' → Marx.",
    exemplo:
      "Uma greve por melhores salários pode ser lida como ação coletiva organizada de uma classe (Marx) e como fato social que pressiona a estrutura (Durkheim).",
  },
  {
    topic: "Brasil República (Velha, Vargas, Militar, Nova República)",
    area: "Ciências Humanas e suas Tecnologias",
    essencial: [
      "República Velha (1889–1930): café com leite, coronelismo, voto de cabresto.",
      "Era Vargas (1930–45): trabalhismo, CLT, Estado Novo (ditadura), nacionalismo.",
      "Ditadura Militar (1964–85): AI-5, censura, 'milagre econômico', repressão.",
      "Nova República (1985→): redemocratização, Constituição de 1988, estabilização (Plano Real).",
    ],
    pega: "Não confunda os dois períodos autoritários: Estado Novo (Vargas, 1937) e Regime Militar (1964). Contextos e atores diferentes.",
    exemplo:
      "A CLT (1943) é da Era Vargas; a criação do SUS e a eleição direta para presidente são conquistas da Constituição de 1988.",
  },
  {
    topic: "Filosofia Antiga, Moderna e Contemporânea",
    area: "Ciências Humanas e suas Tecnologias",
    essencial: [
      "Antiga: Sócrates (conhece-te), Platão (mundo das ideias), Aristóteles (virtude, lógica).",
      "Moderna: Descartes (dúvida, racionalismo), contratualistas (Hobbes, Locke, Rousseau).",
      "Contemporânea: Foucault (poder), Arendt (política, banalidade do mal), Escola de Frankfurt (indústria cultural).",
    ],
    pega: "Contratualistas divergem sobre a natureza humana: Hobbes (o homem é lobo do homem), Rousseau (nasce bom, a sociedade corrompe), Locke (direitos naturais à propriedade).",
    exemplo:
      "'O Estado existe para garantir a segurança porque o estado de natureza é uma guerra de todos contra todos' → Hobbes.",
  },
];

export function resumoFor(topic: string): Resumo | undefined {
  return RESUMOS.find((r) => r.topic === topic);
}
