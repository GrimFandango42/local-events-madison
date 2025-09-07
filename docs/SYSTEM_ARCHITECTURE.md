# System Architecture

Components:
- Web App: Next.js 14 (App Router) + Tailwind, in `app/`
- API: Next.js route handlers in `app/api/*`
- Data: Prisma ORM with SQLite for dev (`prisma/schema.prisma`)
- Scraping: MCP/Playwright service in `backend/services/MCPEventCollector.ts`
- Connector: ChatGPT MCP server in `chatgpt-connector/`

Data flow:
1) Admin/users add sources (websites/feeds) via UI or API
2) MCPEventCollector scrapes sources and extracts events
3) Events persisted via Prisma and exposed via `/api/events`
4) Frontend lists, filters, and searches events
5) ChatGPT connector queries the API for natural language flows

Local defaults:
- App on http://localhost:3000
- Database: SQLite `file:./dev.db`
- Connector reads `LOCAL_EVENTS_API_URL` (defaults to http://localhost:3000)

See also: `docs/ARCHITECTURE.md`, `docs/mcp-implementation-summary.md`.
