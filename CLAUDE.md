# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Start Postgres (pgvector)
docker compose up postgres -d

# Run database migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Development
pnpm dev:backend    # tsx watch on backend (port 8000)
pnpm dev:frontend   # vite dev server (port 3000)

# Build all packages
pnpm build

# Docker dev (hot reload)
pnpm docker:dev       # starts all services with volume mounts + hot reload
pnpm docker:dev:down  # stops dev containers

# Docker production deploy
pnpm docker:deploy       # builds and starts all services in detached mode
pnpm docker:deploy:down  # stops production containers
```

## Architecture

Monorepo with two packages (`pnpm-workspace.yaml`):

- **`packages/backend`** — Fastify API + data pipeline (TypeScript, ESM)
- **`packages/frontend`** — React 19 SPA with Vite, Tailwind v4, react-router-dom v7

### Backend Pipeline

The core pipeline (`reports/generator.ts → runPipeline()`) runs on a cron schedule (6am/12pm/6pm) and can be triggered manually via `POST /api/pipeline/run`:

1. **Fetch** — RSS feeds parsed via `rss-parser`, filtered by energy/oil/gas keywords (`feeds/fetcher.ts`)
2. **Dedup** — URL uniqueness check, then embedding-based cosine similarity via pgvector (`dedup/embeddings.ts`)
3. **Store** — Articles saved to Postgres with vector embeddings
4. **Summarize** — Each article summarized by LLM in Vietnamese (`analysis/analyzer.ts`)
5. **Synthesize** — All summaries combined into a structured JSON report (key developments, price drivers, supply/demand signals, geopolitical factors, outlook)

### AI Integration

All LLM/embedding calls go through **OpenRouter** using the OpenAI SDK with `baseURL: 'https://openrouter.ai/api/v1'`. Models are configured in `config.ts` (`config.models.chat` and `config.models.embedding`). Do not use direct Anthropic/OpenAI endpoints.

### Database

PostgreSQL 16 with pgvector extension. Schema in `packages/backend/prisma/schema.prisma`. Two models: `Article` (with 1536-dim vector embedding) and `Report` (with JSON synthesis). Embeddings are stored via raw SQL since Prisma doesn't natively support the vector type.

### API Routes (`api/routes.ts`)

- `GET /api/reports/latest` — most recent report with articles
- `GET /api/reports?date=YYYY-MM-DD` — reports by date
- `GET /api/reports/:id` — single report
- `POST /api/pipeline/run` — trigger pipeline manually

### Configuration

All config is in `config.ts`: RSS feed URLs, keyword filters, cron schedules, model names, dedup threshold. Environment variables: `OPENROUTER_API_KEY`, `DATABASE_URL`, `PORT`.

### Output Language

Summaries and synthesis reports are generated in **Vietnamese**. System prompts in `analysis/analyzer.ts` are in Vietnamese.
