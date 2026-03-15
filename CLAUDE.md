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

# Trigger pipeline manually
pnpm pipeline       # runs curl POST to /api/pipeline/run

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

### Backend

Entry point: `src/index.ts` — initializes pgvector extension, creates Fastify app with CORS, registers routes, starts scheduler, listens on `0.0.0.0:8000`.

```
packages/backend/src/
├── index.ts              # Entry point
├── config.ts             # Zod-validated config (feeds, schedule, models)
├── analysis/
│   └── analyzer.ts       # LLM summarization in Vietnamese
├── api/
│   └── routes.ts         # REST endpoints
├── db/
│   └── index.ts          # Prisma client, pgvector setup
├── dedup/
│   └── embeddings.ts     # Cosine similarity dedup via pgvector
├── feeds/
│   ├── fetcher.ts        # RSS parsing + keyword filtering
│   └── types.ts          # Feed type definitions
├── reports/
│   └── generator.ts      # runPipeline() orchestration
└── scheduler/
    └── jobs.ts           # node-cron scheduling
```

### Backend Pipeline

The core pipeline (`reports/generator.ts → runPipeline()`) runs on a cron schedule (6am/12pm/6pm) and can be triggered manually via `POST /api/pipeline/run`:

1. **Fetch** — RSS feeds parsed via `rss-parser`, filtered by energy/oil/gas keywords (`feeds/fetcher.ts`)
2. **Dedup** — URL uniqueness check, then embedding-based cosine similarity via pgvector (`dedup/embeddings.ts`)
3. **Store** — Articles saved to Postgres with vector embeddings
4. **Summarize** — Each article summarized by LLM in Vietnamese (`analysis/analyzer.ts`)
5. **Synthesize** — All summaries combined into a structured JSON report (key developments, price drivers, supply/demand signals, geopolitical factors, outlook)

### Frontend

React 19 SPA built with Vite 6 and Tailwind v4. UI is in Vietnamese.

**Pages:**
- `Dashboard` (`/`) — latest market synthesis + today's reports
- `ReportDetail` (`/reports/:id`) — single report with synthesis and article list

**Components:** `Layout` (app shell with theme toggle), `ReportCard`, `ArticleList`, `Synthesis`

**API client** (`api/client.ts`): typed fetch wrapper over `/api` — `fetchLatestReport()`, `fetchReport(id)`, `fetchReportsByDate(date)`, `fetchTodaysReports()`, `triggerPipeline()`

**Dark mode:** `hooks/useTheme.ts` — persists to localStorage, auto-detects system preference via `prefers-color-scheme`

### Scheduler

`scheduler/jobs.ts` uses `node-cron` to schedule `runPipeline()`. Cron expressions are read from `config.schedule.crons` (default: `0 6 * * *`, `0 12 * * *`, `0 18 * * *` — 6am/12pm/6pm daily).

### AI Integration

All LLM/embedding calls go through **OpenRouter** using the OpenAI SDK with `baseURL: 'https://openrouter.ai/api/v1'`. Do not use direct Anthropic/OpenAI endpoints.

Models (configured in `config.ts`):
- **Chat:** `google/gemini-3-flash-preview` (`config.models.chat`)
- **Embedding:** `qwen/qwen3-embedding-8b` (`config.models.embedding`) — 4096 dimensions

### Database

PostgreSQL 16 with pgvector extension. Schema in `packages/backend/prisma/schema.prisma`. Two models: `Article` (with 4096-dim vector embedding) and `Report` (with JSON synthesis). Embeddings are stored via raw SQL since Prisma doesn't natively support the vector type.

### API Routes (`api/routes.ts`)

- `GET /api/reports/latest` — most recent report with articles
- `GET /api/reports?date=YYYY-MM-DD` — reports by date
- `GET /api/reports/:id` — single report
- `POST /api/pipeline/run` — trigger pipeline manually

### Configuration

All config is in `config.ts` with **Zod validation** for environment variables. See `.env.example` for required variables:
- `OPENROUTER_API_KEY` — LLM/embedding API key
- `DATABASE_URL` — PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5433/newsbot`)
- `PORT` — backend port (default: 8000)

Config also defines: RSS feed URLs, keyword filters, cron schedules, model names, dedup similarity threshold.

### Docker Setup

Three compose files:
- `docker-compose.yml` — base services (postgres, backend, frontend)
- `docker-compose.dev.yml` — dev override with volume mounts + hot reload
- `docker-compose.prod.yml` — production with restart policies

Both backend and frontend use **multi-stage Dockerfiles**. Frontend production serves via **nginx:alpine** on port 3000 with SPA fallback (`try_files $uri $uri/ /index.html`) and API proxy (`/api/` → `http://backend:8000`).

Postgres is exposed on **host port 5433** (maps to container 5432).

### TypeScript

`tsconfig.base.json`: ES2022 target, ESNext modules, bundler module resolution. ESM throughout (`"type": "module"` in all packages).

### Output Language

Summaries and synthesis reports are generated in **Vietnamese**. System prompts in `analysis/analyzer.ts` are in Vietnamese.
