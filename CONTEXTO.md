# Contexto do projeto — para conversar sobre ele fora do Claude Code

Cole este arquivo (ou suba o repositório inteiro) num **Projeto do Claude** em
claude.ai e o Claude "normal" terá quase todo o contexto que o Claude Code teve.

Repositório: https://github.com/usguilherme/siteamorestudos
Site no ar: https://siteamorestudos.vercel.app

---

## O que é

Plataforma de estudos para o ENEM, uso pessoal (uma usuária: **Valessa**, namorada
do dono do repo). Feita com carinho — o tom das mensagens é acolhedor e chama a
usuária pelo nome.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — tokens semânticos em `src/app/globals.css`, tema claro/escuro
- **Recharts** — gráficos de desempenho
- **Firebase Realtime Database** — sincronização entre dispositivos (opcional; o app
  funciona 100% offline sem ele)
- **Groq** (`openai/gpt-oss-120b` / `-20b`) — extração de questões de PDF e correção
  de redação
- Deploy: **Vercel**, projeto `siteamorestudos`. Push na `main` → deploy automático.

> `AGENTS.md` diz que é um "Next.js modificado" — na prática é Next 16 padrão; a
> regra real é ler os docs em `node_modules/next/dist/docs/`.

## Arquitetura de dados — `src/lib/store.ts`

Camada única. `AppData` em memória, hooks via `useSyncExternalStore`.

Persistência **dividida em dois blocos** (questões são grandes e mudam pouco;
progresso da aluna é pequeno e muda a cada questão):

| Bloco | localStorage | Realtime Database |
|---|---|---|
| Questões | `ea:v2:questions` | `valessa/questions` → `{ list, updatedAt }` |
| Progresso (attempts, sessions, redacoes, favorites, reviewedAt, settings) | `ea:v2:user` | `valessa/user` → `{ ...campos, updatedAt }` |

- Cada bloco tem seu `updatedAt`; na leitura, o remoto só substitui o local se for
  mais novo (last-write-wins por bloco).
- `mutateUser()` e `mutateQuestions()` — cada mutação cria referências novas em todos
  os níveis (senão o `useSyncExternalStore` não re-renderiza) e agenda persistência
  só do seu bloco (debounce).
- Migração automática: `estudos_amor_*` (v1) e `ea:v2:data` (v2 combinado) → blocos v3.
- RTDB **não aceita `undefined`** — o payload passa por `JSON.parse(JSON.stringify())`
  antes de subir.

## Rotas (`src/app/`)

| Rota | O quê |
|---|---|
| `/` | Home: saudação, contagem ENEM, meta, resumo do plano, grid de recursos |
| `/plano` | Plano do dia (ver abaixo) |
| `/simulado` | Motor de simulado — `src/components/simulado/SimuladoApp.tsx` |
| `/redacao` | Editor + correção IA — `src/components/redacao/RedacaoApp.tsx` |
| `/redacao/guia` | 5 competências, estrutura, repertório, temas |
| `/redacao/folha` | Folha de 30 linhas para imprimir |
| `/desempenho` | KPIs, nota estimada, gráficos (recharts) |
| `/diagnostico` | Prioridades por incidência × desempenho |
| `/revisar-erros` | Fila de revisão espaçada |
| `/resumos` | ~25 resumos de 1 tela |
| `/materias` | Banco por área/assunto |
| `/favoritas`, `/historico` | Caderno e histórico |
| `/admin/nova-questao`, `/admin/questoes` | Cadastrar/importar/editar questões |
| `/ajustes` | Nome, meta, datas ENEM, tema, backup, zona de perigo |
| `/api/extrair-questoes` | POST `{text}` → questões estruturadas (Groq) |
| `/api/corrigir-redacao` | POST `{tema, text}` → nota por competência (Groq) |
| `/estatisticas` | redireciona para `/desempenho` |

## Libs importantes (`src/lib/`)

- `store.ts` — dados (acima)
- `stats.ts` — métricas derivadas: `computeStats`, `computeReviewQueue` (revisão
  espaçada 1/3/7/15/30 dias), `computeScoreEstimate` (nota heurística), `computePriorities`
- `enem.ts` — áreas e assuntos do ENEM + `INCIDENCE` (estimativa de quantas provas
  cada assunto apareceu — **aproximação, não dado oficial**)
- `plano.ts` — `useDayPlan()`: monta as tarefas do dia; visão de semana sem "streak
  que quebra"
- `redacao.ts` — competências, estrutura, repertório, temas (conteúdo estático)
- `resumos.ts` — os resumos de 1 tela
- `messages.ts` — frases de incentivo
- `theme.ts` — modo escuro + script anti-flash
- `firebase.ts` — init resiliente (sem env → roda só offline)

## Componentes-chave (`src/components/`)

- `ui.tsx` — design system (Card, Button, Badge, StatCard, ProgressBar, PageHeader,
  EmptyState, Field, inputClass, selectClass)
- `AppChrome.tsx` — Navbar (drawer mobile), Footer, ThemeSync, ServiceWorkerRegister
- `Onboarding.tsx` — modal de primeiro acesso (pede nome)
- `Countdown.tsx` — contagem regressiva ENEM
- `PerformanceCharts.tsx` — gráficos recharts (client)

## Decisões e pegadinhas (contexto que não está óbvio no código)

- **Nota estimada (TRI)**: `computeScoreEstimate` NÃO é a TRI oficial. É `300 + acerto
  ponderado por dificuldade × 700`, com penalidade quando acerta difícil e erra fácil.
  Sempre rotulada como estimativa na UI.
- **Incidência**: valores em `enem.ts` são estimativa do padrão histórico, não
  contagem oficial. Idem.
- **Banco de questões**: importado de `api.enem.dev` (dados abertos, GPL-2.0) pelo
  script `scripts/import-enem.mjs` — 2009 a 2023, ~2.650 questões. Pré-2009 o ENEM
  era outro exame (63 questões), por isso não entra.
- **Classificação de assunto**: por palavras-chave (rápido, offline) + passe opcional
  de IA (`--ai`) para as restantes. Cobertura parcial é esperada; questões sem
  assunto ainda funcionam (filtro por área/ano/dificuldade).
- **Groq**: o modelo `llama-3.1-8b-instant` foi descontinuado. A lista de modelos da
  Groq muda — checar `GET /openai/v1/models` antes de assumir que um existe.
- **Imagens das questões**: vêm de `enem.dev/...`. Muitas questões dependem de
  gráfico/figura; quando a imagem falta, a questão fica marcada `possiblyHasImage`.
- **PWA**: `src/app/manifest.ts` + `public/sw.js` (shell offline, network-first).
- **Regras do RTDB**: hoje em modo teste **aberto** (`database.rules.json` restringe
  ao nó `valessa`, mas ainda é leitura/escrita liberada). Sem autenticação.

## Variáveis de ambiente (Vercel + `.env.local`, gitignored)

```
GROQ_API_KEY
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_DATABASE_URL
```

## Ideias em aberto (não feitas)

- Página de ajuda `/ajuda` dentro do app (hoje o guia é o `COMO-USAR.md`)
- Autenticação no Firebase (regras estão abertas)
- Pomodoro com registro de sessão
- Lembrete/notificação em horário definido
- Resumos das áreas de humanas/linguagens (hoje o foco é exatas)
- Notas de corte SISU/ProUni (pós-prova)
- Migrar questões para IndexedDB se o blob de ~3 MB apertar o localStorage no celular

## Como buildar/rodar

```
npm install
npm run dev      # localhost:3000
npm run build
npm run lint
```

Ver `README.md` (técnico) e `COMO-USAR.md` (guia da usuária).
