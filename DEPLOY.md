# Deploy (Cloudflare) - Poço Digital

Este documento descreve o processo de deploy da API (Workers) e do Web (Pages).

## Pre-requisitos
- Node.js + npm instalados.
- Conta Cloudflare com acesso a Workers, D1 e Pages.
- `wrangler` disponivel via `npx`.

## 1) Deploy da API (Cloudflare Workers + D1)

### 1.1 Login
```sh
cd /Users/vittordeaguiar/www/poco-api/apps/api
npx wrangler login
```

### 1.2 Verificar D1
O arquivo `wrangler.toml` deve apontar para o D1 correto:
```
database_name = "poco-db"
database_id = "..."
```

### 1.3 Aplicar migrations
```sh
npx wrangler d1 migrations apply poco-db --remote
```

### 1.4 Configurar variaveis/segredos
O Worker usa variaveis via `wrangler secret`:

```sh
printf "megamoveis2626" | npx wrangler secret put API_KEY
printf "https://poco-web.pages.dev" | npx wrangler secret put CORS_ORIGINS
```

> `CORS_ORIGINS` aceita lista separada por virgula (ex.: `https://poco-web.pages.dev,https://outro.site`).

### 1.5 Deploy do Worker
```sh
npm run deploy
```

Ao final, o `wrangler` exibe a URL do Worker, ex.:
```
https://poco-api.<subdominio>.workers.dev
```

## 2) Deploy do Web (Cloudflare Pages)

### 2.1 Configurar URL da API no build
Crie (ou atualize) o `.env.production`:
```sh
cd /Users/vittordeaguiar/www/poco-api/apps/web
cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://poco-api.<subdominio>.workers.dev
EOF
```

### 2.2 Instalar dependencias
```sh
npm install
```

### 2.3 Build
```sh
npm run build
```

### 2.4 Criar o projeto Pages (apenas uma vez)
```sh
npx wrangler pages project create poco-web --production-branch main
```

### 2.5 Deploy do Pages
```sh
npx wrangler pages deploy dist --project-name poco-web --commit-dirty=true
```

O `wrangler` retorna a URL do deploy, ex.:
```
https://<hash>.poco-web.pages.dev
```

> A URL estavel do projeto e `https://poco-web.pages.dev`.

## 3) Checklist rapido (quando for atualizar)
- [ ] Alterou API? `npm run deploy` em `apps/api`.
- [ ] Alterou Web? `npm run build` + `wrangler pages deploy` em `apps/web`.
- [ ] Mudou variaveis? Atualizar com `wrangler secret put`.

