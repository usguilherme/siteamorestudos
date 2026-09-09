# Estudos do Amor ❤️

Plataforma de estudos para o ENEM: simulados cronometrados (treino ou prova),
revisão espaçada dos erros, favoritas, acompanhamento de desempenho com gráficos,
contagem regressiva pra prova, metas diárias, modo escuro e PWA (dá pra instalar no
celular).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** com tokens semânticos e tema claro/escuro
- **Recharts** para os gráficos de desempenho
- **Groq (Llama)** para extrair questões de PDFs de prova
- Dados em **localStorage** (offline-first) espelhados no **Firebase Realtime
  Database** quando configurado — sincroniza entre celular e computador

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

### Variáveis de ambiente (`.env.local`)

```
GROQ_API_KEY=...

# Sincronização na nuvem (opcional — sem isso o app roda só neste aparelho)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://<projeto>-default-rtdb.firebaseio.com
```

### Regras do Realtime Database

O app grava tudo no nó `valessa/`. Publique `database.rules.json`:

```bash
firebase deploy --only database
```

ou cole o conteúdo no console do Firebase → Realtime Database → Regras.

## Estrutura

| Caminho | O quê |
|---|---|
| `src/lib/store.ts` | Camada de dados única (localStorage + sync RTDB, hooks) |
| `src/lib/stats.ts` | Métricas derivadas e fila de revisão espaçada |
| `src/lib/enem.ts` | Áreas e assuntos do ENEM (fonte única) |
| `src/lib/messages.ts` | Mensagens de incentivo |
| `src/components/ui.tsx` | Design system (Card, Button, Badge, …) |
| `src/components/simulado/` | Motor do simulado |
| `src/app/` | Páginas (App Router) |

## Deploy (Vercel)

1. Configure as variáveis de ambiente acima no projeto da Vercel.
2. `vercel --prod` (ou push na branch conectada).
3. Publique as regras do Realtime Database.
