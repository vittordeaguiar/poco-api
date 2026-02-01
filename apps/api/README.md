# poco-api (Cloudflare Workers)

API scaffold using Cloudflare Workers + Hono.

## Local development

```sh
cd /Users/vittordeaguiar/www/poco-api/apps/api
npm install
npm run dev
```

Or without scripts:

```sh
cd /Users/vittordeaguiar/www/poco-api/apps/api
npx wrangler dev
```

## Endpoints

- `GET /health` -> `{ ok: true, data: { status: "up" } }`

## Scripts

- `npm run dev`
- `npm run deploy`
- `npm run lint`
