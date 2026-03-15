# Energy News Bot

Automated energy news aggregation, deduplication, AI summarization, and synthesis — with reports generated in Vietnamese.

## Features

- **RSS Aggregation** — fetches from 8+ energy/oil/gas news sources
- **Semantic Deduplication** — embedding-based cosine similarity via pgvector to filter duplicate stories
- **AI Summarization** — each article summarized individually by LLM
- **Market Synthesis** — structured report with key developments, price drivers, supply/demand signals, geopolitical factors, and outlook
- **Scheduled Pipeline** — runs automatically at 6am, 12pm, and 6pm daily
- **Dark/Light Theme** — system-preference-aware with manual toggle
- **Responsive UI** — dashboard and report detail views in Vietnamese

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS v4, react-router-dom v7 |
| Backend | Fastify 5, TypeScript (ESM), Prisma 6 |
| Database | PostgreSQL 16 + pgvector |
| AI | OpenRouter (Google Gemini 3 Flash, Qwen3 Embedding 8B) |
| Scheduling | node-cron |
| Infrastructure | Docker, nginx, multi-stage builds |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (for Postgres)

### Setup

```bash
# Clone and install
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your OPENROUTER_API_KEY

# Start Postgres
docker compose up postgres -d

# Run migrations and generate Prisma client
pnpm db:migrate
pnpm db:generate

# Start development servers
pnpm dev:backend    # API on http://localhost:8000
pnpm dev:frontend   # UI on http://localhost:3000
```

## Docker Development

Starts all services with hot reload via volume mounts:

```bash
pnpm docker:dev
pnpm docker:dev:down   # stop
```

## Docker Production

Builds optimized images and runs in detached mode:

```bash
pnpm docker:deploy
pnpm docker:deploy:down   # stop
```

Frontend is served via nginx with SPA fallback and API reverse proxy.

## Architecture

```
news-bot/
├── packages/
│   ├── backend/          # Fastify API + data pipeline
│   │   └── src/
│   │       ├── index.ts          # Entry point
│   │       ├── config.ts         # Zod-validated configuration
│   │       ├── analysis/         # LLM summarization
│   │       ├── api/              # REST routes
│   │       ├── db/               # Prisma client
│   │       ├── dedup/            # Embedding-based dedup
│   │       ├── feeds/            # RSS fetching + filtering
│   │       ├── reports/          # Pipeline orchestration
│   │       └── scheduler/        # Cron jobs
│   └── frontend/         # React SPA
│       └── src/
│           ├── pages/            # Dashboard, ReportDetail
│           ├── components/       # Layout, ReportCard, ArticleList, Synthesis
│           ├── hooks/            # useTheme (dark mode)
│           └── api/              # Typed API client
├── docker-compose.yml
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

### Pipeline Flow

```
RSS Feeds → Fetch & Filter → Deduplicate (pgvector) → Store → Summarize (LLM) → Synthesize Report (LLM)
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/latest` | Most recent report with articles |
| GET | `/api/reports?date=YYYY-MM-DD` | Reports for a specific date |
| GET | `/api/reports/:id` | Single report by ID |
| POST | `/api/pipeline/run` | Trigger pipeline manually |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | API key for OpenRouter (LLM + embeddings) | — |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5433/newsbot` |
| `PORT` | Backend server port | `8000` |

## License

MIT
