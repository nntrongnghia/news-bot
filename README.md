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
pnpm dev:backend    # API on http://localhost:8806
pnpm dev:frontend   # UI on http://localhost:3306
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

## Production Deployment

### 1. Configure Environment Variables

Create a `.env` file on your production server:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-production-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/newsbot
PORT=8806
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
AUTH_ADMIN_EMAIL=admin@yourdomain.com
AUTH_ADMIN_PASSWORD=a-strong-password
TRUSTED_ORIGINS=https://your-domain.com
PIPELINE_API_KEY=your-pipeline-api-key-min-16-chars
```

Key settings:
- **`TRUSTED_ORIGINS`** — set to your production URL (e.g., `https://news.example.com`). Supports comma-separated values for multiple origins. This controls the CORS whitelist; without it, the backend rejects browser requests from your domain.
- **`DATABASE_URL`** — for local dev only. Docker Compose overrides this internally to `postgresql://postgres:postgres@postgres:5432/newsbot`.
- **`BETTER_AUTH_SECRET`** — must be at least 32 characters. Generate with `openssl rand -base64 32`.

### 2. Deploy with Docker Compose

```bash
pnpm docker:deploy
```

This uses `docker-compose.yml` + `docker-compose.prod.yml` with restart policies. Services communicate over Docker's internal network — no localhost references needed.

### 3. Set Up HTTPS with a Reverse Proxy

Place a reverse proxy (Caddy, Traefik, or a cloud load balancer) in front of the frontend container (port 3306) to handle TLS termination.

**Example with Caddy** (`Caddyfile`):

```
your-domain.com {
    reverse_proxy localhost:3306
}
```

Caddy automatically provisions and renews Let's Encrypt certificates.

### 4. DNS

Point your domain's A/AAAA record to your server's IP address.

### What's Already Production-Ready

| Component | Why no changes needed |
|-----------|----------------------|
| Frontend API client | Uses relative `/api` paths, no hardcoded host |
| Auth client | Uses `window.location.origin` at runtime |
| Nginx config | Proxies `/api/` to `http://backend:8806` via Docker DNS |
| Docker networking | Services reference each other by name (`backend`, `postgres`) |
| Database URL | Docker Compose overrides `.env` with internal connection string |

### Verification

1. Visit `https://your-domain.com` — dashboard should load
2. Open browser DevTools Network tab — `/api/*` calls should return 200
3. If you see CORS errors, verify `TRUSTED_ORIGINS` matches your domain exactly (including `https://`)

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
| `PORT` | Backend server port | `8806` |
| `BETTER_AUTH_SECRET` | Auth secret key (min 32 chars) | — |
| `AUTH_ADMIN_EMAIL` | Admin account email | `admin@local.dev` |
| `AUTH_ADMIN_PASSWORD` | Admin account password | `changeme` |
| `TRUSTED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3306` |
| `PIPELINE_API_KEY` | API key for pipeline trigger endpoint (min 16 chars) | — |

## License

MIT
