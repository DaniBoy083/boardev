# Boardev

Projeto Next.js 16 com App Router em `src/app` e rota de API de autenticação em `src/app/api/auth/[...nextauth]/route.ts`.

## Requisitos

- Node.js 20+
- npm 10+

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env.local` na raiz com as variáveis:

```env
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
NEXTAUTH_SECRET=uma_chave_segura
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000
FIREBASE_PROJECT_ID=boardev-c50f6
FIREBASE_WEB_API_KEY=sua_web_api_key_do_firebase
```

## Produção

- Em deploy (ex.: Vercel), configure as variáveis no painel de ambiente:
	- `GOOGLE_CLIENT_ID`
	- `GOOGLE_CLIENT_SECRET`
	- `NEXTAUTH_SECRET`
	- `NEXTAUTH_URL` (URL publica do app em producao)
	- `NEXT_PUBLIC_URL` (mesma URL publica)
	- `FIREBASE_PROJECT_ID`
	- `FIREBASE_WEB_API_KEY`
- Garanta que o callback OAuth do Google inclua sua URL de produção:
	- `https://seu-dominio/api/auth/callback/google`

## Scripts

- Desenvolvimento:

```bash
npm run dev
```

- Lint:

```bash
npm run lint
```

- Build de produção:

```bash
npm run build
```

- Executar build:

```bash
npm run start
```
