# Dropship Ops Dashboard — Setup Guide

Private dashboard for Shopify revenue tracking, team whiteboard, chat, and time clock.

## Stack

- **UI:** Vision UI Dashboard (gocloned from [demo](https://demos.creative-tim.com/vision-ui-dashboard-react/) + React source)
- **Hosting:** Vercel (free Hobby tier)
- **Database / Auth / Realtime:** Supabase (free tier)
- **Shopify:** Custom app OAuth (free with your store)

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)
3. In **Authentication → Users**, create two users (you + partner). Disable public signup.
4. Copy **Project URL**, **anon key**, and **service role key**

## 2. Shopify custom app

1. Go to [dev.shopify.com/dashboard](https://dev.shopify.com/dashboard) → **Apps** → **Create app**
2. Choose **Custom app** (or legacy custom app in Partner Dashboard)
3. Set scopes: `read_orders`, `read_products`, `read_customers`
4. **App URL:** `https://YOUR-VERCEL-APP.vercel.app`
5. **Allowed redirection URL:** `https://YOUR-VERCEL-APP.vercel.app/api/shopify/callback`
6. Copy **Client ID** (API key) and **Client secret**

### Order webhooks (optional)

Register webhook `orders/create` and `orders/updated` pointing to:

`https://YOUR-VERCEL-APP.vercel.app/api/shopify/webhooks/orders`

Orders also sync via Vercel Cron every 30 minutes.

## 3. Environment variables

Copy `.env.example` to `.env.local` for local dev:

```bash
cp .env.example .env.local
```

| Variable | Where |
|----------|--------|
| `REACT_APP_SUPABASE_URL` | Supabase → Settings → API |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (server only) |
| `SHOPIFY_API_KEY` | Shopify app Client ID |
| `SHOPIFY_API_SECRET` | Shopify app secret |
| `SHOPIFY_SCOPES` | `read_orders,read_products,read_customers` |
| `APP_URL` | `http://localhost:3000` locally, Vercel URL in prod |
| `CRON_SECRET` | Random string — protects `/api/cron/sync-orders` |

Add the same variables in **Vercel → Project → Settings → Environment Variables**.

## 4. Local development

For API routes (`/api/*`), use Vercel dev:

```bash
npm install
vercel dev
```

For UI-only work without APIs:

```bash
npm start
```

## 5. Deploy to Vercel

```bash
git init
git add .
git commit -m "Initial dropship ops dashboard"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

1. Import repo in [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Create React App**
3. Add all env vars
4. Deploy — cron job runs from `vercel.json` automatically

## 6. First use

1. Open your Vercel URL → sign in with Supabase user
2. **Settings** → enter shop name → **Connect Shopify**
3. **Settings** → **Sync orders now**
4. **Revenue** → view KPIs; add ad spend / COGS manually
5. **Team** → chat + clock in/out
6. **Whiteboard** → create a shared board with your partner

## Gocloned demo reference

Static mirror of the Creative Tim demo lives at `public/goclone-reference/` for visual reference.
