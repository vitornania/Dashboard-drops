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
| `SUPABASE_ANON_KEY` | Same anon key (server runtime config fallback) |
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

## Cron / scheduled sync (no Vercel Pro)

Vercel Hobby does not support reliable cron without Pro. Use these instead:

1. **Shopify webhooks** (best) — register `orders/create` and `orders/updated` →  
   `https://YOUR-APP.vercel.app/api/shopify/webhooks/orders`
2. **GitHub Actions** (free) — workflow `.github/workflows/sync-orders.yml` runs every 6 hours.  
   Add repo secrets: `APP_URL`, `CRON_SECRET` (Settings → Secrets → Actions).
3. **Manual** — Settings or Revenue → **Sync / Refresh orders**
4. **Auto on visit** — Revenue page syncs when you open it

## Local dev with APIs

```bash
cp .env.example .env.local
# fill in values
npm run dev:vercel
```

Plain `npm start` serves the React app only; serverless `/api/*` routes need `dev:vercel`.
