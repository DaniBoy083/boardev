# Boardev

Projeto Next.js 16 com App Router em `src/app` e rota de API de autenticação em `src/pages/api/auth/[...nextauth].ts`.

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
JWT_SECRET=uma_chave_segura
NEXTAUTH_URL=http://localhost:3000
```

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
