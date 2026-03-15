import { FastifyInstance } from 'fastify';
import { prisma } from '../db/index.js';
import { runPipeline } from '../reports/generator.js';

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
  app.get<{ Querystring: { date?: string } }>(
    '/api/reports',
    async (req) => {
      const dateStr = req.query.date;
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
      });

      return reports;
    }
  );

  // Manual pipeline trigger
  app.post('/api/pipeline/run', async () => {
    const report = await runPipeline();
    return report;
  });
}
