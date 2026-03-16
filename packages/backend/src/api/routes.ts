import { FastifyInstance } from 'fastify';
import { prisma } from '../db/index.js';
import { runPipeline } from '../reports/generator.js';
import { config } from '../config.js';
import { auth } from '../auth.js';

// Simple in-memory rate limiter: 5 feedback submissions per hour per IP
const feedbackRateLimit = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const timestamps = (feedbackRateLimit.get(ip) || []).filter(t => t > hourAgo);
  feedbackRateLimit.set(ip, timestamps);
  return timestamps.length >= 5;
}

function recordRequest(ip: string) {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const timestamps = (feedbackRateLimit.get(ip) || []).filter(t => t > hourAgo);
  timestamps.push(now);
  feedbackRateLimit.set(ip, timestamps);
}

// Rate limiter for tracking: 60 per minute per IP
const trackRateLimit = new Map<string, number[]>();

function isTrackRateLimited(ip: string): boolean {
  const now = Date.now();
  const minuteAgo = now - 60 * 1000;
  const timestamps = (trackRateLimit.get(ip) || []).filter(t => t > minuteAgo);
  trackRateLimit.set(ip, timestamps);
  return timestamps.length >= 60;
}

function recordTrackRequest(ip: string) {
  const now = Date.now();
  const minuteAgo = now - 60 * 1000;
  const timestamps = (trackRateLimit.get(ip) || []).filter(t => t > minuteAgo);
  timestamps.push(now);
  trackRateLimit.set(ip, timestamps);
}

async function requireAdmin(req: { headers: Record<string, string | string[] | undefined> }): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as Record<string, string>,
    });
    return session?.user?.role === 'admin';
  } catch {
    return false;
  }
}

export async function registerRoutes(app: FastifyInstance) {
  // Get latest report
  app.get('/api/reports/latest', async () => {
    const report = await prisma.report.findFirst({
      orderBy: { generatedAt: 'desc' },
      include: { articles: true },
    });

    if (!report) {
      return { error: 'No reports found' };
    }

    return report;
  });

  // Get report by id
  app.get<{ Params: { id: string } }>('/api/reports/:id', async (req) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return { error: 'Invalid report ID' };
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: { articles: true },
    });

    if (!report) {
      return { error: 'Report not found' };
    }

    return report;
  });

  // Get reports by date
  app.get<{ Querystring: { date?: string; limit?: string } }>(
    '/api/reports',
    async (req) => {
      const dateStr = req.query.date;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
      let where = {};

      if (dateStr) {
        const start = new Date(`${dateStr}T00:00:00Z`);
        const end = new Date(`${dateStr}T23:59:59Z`);
        where = {
          generatedAt: { gte: start, lte: end },
        };
      }

      const reports = await prisma.report.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        include: { articles: true },
        ...(limit && limit > 0 ? { take: limit } : {}),
      });

      return reports;
    }
  );

  // Crude oil price data (proxy Yahoo Finance)
  app.get<{ Querystring: { range?: string; symbol?: string } }>(
    '/api/crude-prices',
    async (req) => {
      const range = req.query.range || '1mo';
      const symbol = req.query.symbol || 'CL=F'; // WTI Crude
      const intervalMap: Record<string, string> = {
        '1d': '5m',
        '5d': '30m',
        '1mo': '1h',
        '3mo': '1d',
        '6mo': '1d',
        '1y': '1d',
      };
      const interval = intervalMap[range] || '1d';

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (!res.ok) {
        return { error: 'Failed to fetch price data', status: res.status };
      }

      const data = await res.json() as {
        chart: {
          result: Array<{
            meta: { regularMarketPrice: number; previousClose: number; currency: string; symbol: string };
            timestamp: number[];
            indicators: { quote: Array<{ close: (number | null)[] }> };
          }>;
        };
      };
      const result = data.chart.result?.[0];
      if (!result) {
        return { error: 'No data available' };
      }

      const timestamps = result.timestamp || [];
      const closes = result.indicators.quote[0]?.close || [];

      const prices = timestamps.map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString(),
        price: closes[i] != null ? Math.round(closes[i]! * 100) / 100 : null,
      })).filter((p: { price: number | null }) => p.price !== null);

      return {
        symbol: result.meta.symbol,
        currency: result.meta.currency,
        currentPrice: result.meta.regularMarketPrice,
        previousClose: result.meta.previousClose,
        prices,
      };
    }
  );

  // Submit feedback
  app.post<{ Body: { name?: string; email?: string; category?: string; message?: string } }>(
    '/api/feedback',
    async (req, reply) => {
      const { name, email, category, message } = req.body || {};

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return reply.status(400).send({ error: 'Message is required' });
      }
      if (message.length > 5000) {
        return reply.status(400).send({ error: 'Message must be under 5000 characters' });
      }

      const ip = req.ip;
      if (isRateLimited(ip)) {
        return reply.status(429).send({ error: 'Too many submissions. Please try again later.' });
      }

      recordRequest(ip);

      const feedback = await prisma.feedback.create({
        data: {
          name: name?.trim() || null,
          email: email?.trim() || null,
          category: category?.trim() || null,
          message: message.trim(),
        },
      });

      return feedback;
    }
  );

  // Page view tracking
  app.post<{ Body: { url?: string; referrer?: string } }>(
    '/api/track',
    async (req, reply) => {
      const { url: pageUrl, referrer } = req.body || {};
      if (!pageUrl || typeof pageUrl !== 'string') {
        return reply.status(400).send({ error: 'url is required' });
      }

      const ip = req.ip;
      if (isTrackRateLimited(ip)) {
        return reply.status(204).send();
      }
      recordTrackRequest(ip);

      // Fire-and-forget
      prisma.pageView.create({
        data: {
          url: pageUrl,
          userAgent: req.headers['user-agent'] || null,
          ip,
          referrer: referrer || null,
        },
      }).catch(() => {});

      return reply.status(204).send();
    }
  );

  // Manual pipeline trigger
  app.post('/api/pipeline/run', async (req, reply) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== config.pipelineApiKey) {
      return reply.status(401).send({ error: 'Invalid API key' });
    }

    const log = await prisma.pipelineLog.create({
      data: { trigger: 'manual', status: 'running' },
    });

    try {
      const report = await runPipeline();
      if (!report) {
        await prisma.pipelineLog.update({
          where: { id: log.id },
          data: { status: 'skipped', finishedAt: new Date() },
        });
        return { message: 'No new articles found', skipped: true };
      }

      await prisma.pipelineLog.update({
        where: { id: log.id },
        data: {
          status: 'success',
          finishedAt: new Date(),
          articleCount: report.articleCount,
          reportId: report.id,
        },
      });
      return report;
    } catch (err) {
      await prisma.pipelineLog.update({
        where: { id: log.id },
        data: {
          status: 'error',
          finishedAt: new Date(),
          error: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }
  });

  // Admin: visit stats
  app.get('/api/admin/visits/stats', async (req, reply) => {
    if (!(await requireAdmin(req))) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);

    const [todayCount, weekCount, monthCount, uniqueIpsToday] = await Promise.all([
      prisma.pageView.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.pageView.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.pageView.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT ip) as count FROM page_views WHERE "createdAt" >= ${todayStart}
      `,
    ]);

    return {
      today: todayCount,
      week: weekCount,
      month: monthCount,
      uniqueIpsToday: Number(uniqueIpsToday[0]?.count ?? 0),
    };
  });

  // Admin: daily visits + top pages
  app.get<{ Querystring: { days?: string } }>(
    '/api/admin/visits',
    async (req, reply) => {
      if (!(await requireAdmin(req))) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const days = Math.min(parseInt(req.query.days || '7', 10) || 7, 90);
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [dailyRaw, topPages] = await Promise.all([
        prisma.$queryRaw<{ date: Date; count: bigint }[]>`
          SELECT DATE("createdAt") as date, COUNT(*) as count
          FROM page_views
          WHERE "createdAt" >= ${since}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `,
        prisma.$queryRaw<{ url: string; count: bigint }[]>`
          SELECT url, COUNT(*) as count
          FROM page_views
          WHERE "createdAt" >= ${since}
          GROUP BY url
          ORDER BY count DESC
          LIMIT 10
        `,
      ]);

      return {
        daily: dailyRaw.map(r => ({
          date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
          count: Number(r.count),
        })),
        topPages: topPages.map(r => ({ url: r.url, count: Number(r.count) })),
      };
    }
  );

  // Admin: unique IPs list
  app.get<{ Querystring: { days?: string; limit?: string } }>(
    '/api/admin/visits/ips',
    async (req, reply) => {
      if (!(await requireAdmin(req))) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const days = Math.min(parseInt(req.query.days || '1', 10) || 1, 90);
      const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
      const since = new Date();
      since.setDate(since.getDate() - days);

      const ips = await prisma.$queryRaw<{ ip: string; count: bigint; lastSeen: Date; lastUserAgent: string | null }[]>`
        SELECT ip, COUNT(*) as count,
               MAX("createdAt") as "lastSeen",
               (ARRAY_AGG("userAgent" ORDER BY "createdAt" DESC))[1] as "lastUserAgent"
        FROM page_views
        WHERE ip IS NOT NULL AND "createdAt" >= ${since}
        GROUP BY ip
        ORDER BY count DESC
        LIMIT ${limit}
      `;

      const total = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT ip) as count FROM page_views
        WHERE ip IS NOT NULL AND "createdAt" >= ${since}
      `;

      return {
        ips: ips.map(r => ({
          ip: r.ip,
          count: Number(r.count),
          lastSeen: r.lastSeen instanceof Date ? r.lastSeen.toISOString() : String(r.lastSeen),
          lastUserAgent: r.lastUserAgent,
        })),
        total: Number(total[0]?.count ?? 0),
      };
    }
  );

  // Admin: pipeline logs
  app.get<{ Querystring: { limit?: string } }>(
    '/api/admin/pipeline-logs',
    async (req, reply) => {
      if (!(await requireAdmin(req))) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);

      const logs = await prisma.pipelineLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: limit,
      });

      return logs;
    }
  );
}
