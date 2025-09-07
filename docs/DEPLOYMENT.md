# Deployment

Options:
- Vercel (Next.js frontend + serverless API)
- Docker (single container)
- VPS (PM2/Node + reverse proxy)

Env basics:
- DATABASE_URL (Postgres recommended for prod)
- NEXTAUTH_URL, NEXTAUTH_SECRET

Baseline steps:
1) Provision Postgres and set DATABASE_URL
2) npm run db:generate && npm run db:push
3) npm run build && npm start

