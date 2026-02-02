# Poço Artesiano Aguiar

Sistema simples para gestão de casas e cobranças de um bairro, com API e painel web. Permite registrar casas e responsáveis, gerar mensalidades, marcar pagamentos, acompanhar inadimplência, registrar ocorrências do poço e auditar mudanças.

## Estrutura
- `apps/api`: API em Cloudflare Workers, com banco D1 (SQLite) e validações de entrada.
- `apps/web`: painel web em React, com rotas para dashboard, casas, pendências, pessoas, inadimplência, ocorrências do poço e auditoria.

## Tecnologias
- API: Cloudflare Workers, Hono, Zod, D1 (SQLite), TypeScript.
- Web: React, React Router, Vite, Tailwind CSS, TypeScript.
- Deploy: Cloudflare Workers (API) e Cloudflare Pages (Web).
