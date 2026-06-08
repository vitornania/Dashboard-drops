# Dropship Ops Dashboard

Private operations dashboard for dropshipping teams — Vision UI shell with:

- **Revenue** — Shopify order sync + P&amp;L (Triple Whale-lite)
- **Whiteboard** — collaborative tldraw boards
- **Team** — Slack-style chat + clock in/out
- **Settings** — Shopify OAuth connect

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill in Supabase + Shopify credentials — see docs/shopify-setup.md
vercel dev
```

## Deploy

Push to GitHub and import on Vercel. See [docs/shopify-setup.md](docs/shopify-setup.md) for full setup.

## UI source

React dashboard based on [Vision UI Dashboard React](https://github.com/creativetimofficial/vision-ui-dashboard-react). Demo mirror gocloned to `public/goclone-reference/`.
