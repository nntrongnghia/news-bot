import { FastifyInstance } from 'fastify';
import { prisma } from '../db/index.js';
import { runPipeline } from '../reports/generator.js';
import { config } from '../config.js';

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

  // Manual pipeline trigger
  app.post('/api/pipeline/run', async (req, reply) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== config.pipelineApiKey) {
      return reply.status(401).send({ error: 'Invalid API key' });
    }
    const report = await runPipeline();
    if (!report) {
      return { message: 'No new articles found', skipped: true };
    }
    return report;
  });
}
