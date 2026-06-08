# Deploy to Vercel

## Import

1. Push this repo to GitHub (see README).
2. In [Vercel](https://vercel.com/new), **Import Git Repository** and select `dropship-ops-dashboard`.
3. Vercel reads `vercel.json` automatically — no extra framework preset needed.
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install` (default)

## Environment variables

Add these in **Project → Settings → Environment Variables** for **Production**, **Preview**, and **Development**:

| Variable | Notes |
|----------|--------|
| `REACT_APP_SUPABASE_URL` | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anon key (safe for browser) |
| `SUPABASE_URL` | Same as `REACT_APP_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never expose to client |
| `SHOPIFY_API_KEY` | Shopify app Client ID |
| `SHOPIFY_API_SECRET` | Shopify app Client secret |
| `SHOPIFY_SCOPES` | `read_orders,read_products,read_customers` |
| `APP_URL` | Production URL, e.g. `https://dropship-ops-dashboard.vercel.app` (no trailing slash) |
| `CRON_SECRET` | Random string; protects `/api/cron/sync-orders` |

After the first deploy, set `APP_URL` to your real Vercel URL and redeploy.

## Shopify OAuth

In the Shopify Partner app:

- **App URL:** `https://YOUR-APP.vercel.app`
- **Allowed redirection URL:** `https://YOUR-APP.vercel.app/api/shopify/callback`

## Cron

`vercel.json` schedules `/api/cron/sync-orders` once daily at 06:00 UTC (Hobby plan limit). Upgrade to Pro for more frequent cron schedules.

## Local dev with APIs

```bash
cp .env.example .env.local
# fill in values
npm run dev:vercel
```

Plain `npm start` serves the React app only; serverless `/api/*` routes need `dev:vercel`.
