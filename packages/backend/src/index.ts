import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { prisma, ensureVectorExtension } from './db/index.js';
import { registerRoutes } from './api/routes.js';
import { startScheduler } from './scheduler/jobs.js';
import { auth } from './auth.js';
import { seedAdminUser } from './db/seed.js';

function toNodeHeaders(headers: Headers): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  headers.forEach((value, key) => {
    if (key === 'set-cookie') return;
    result[key] = value;
  });
  const setCookies = headers.getSetCookie();
  if (setCookies.length > 0) {
    result['set-cookie'] = setCookies;
  }
  return result;
}

async function main() {
  // Ensure pgvector extension exists
  await ensureVectorExtension();

  const app = Fastify({ logger: true });

  // CORS with credentials support
  await app.register(cors, {
    origin: config.trustedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  // BetterAuth catch-all handler
  app.all('/api/auth/*', async (req, reply) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const body = req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined;
    const request = new Request(url.toString(), {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body,
    });

    const response = await auth.handler(request);

    reply.status(response.status);
    reply.headers(toNodeHeaders(response.headers));
    const text = await response.text();
    reply.send(text);
  });

  // Auth guard for all /api/* routes (except /api/auth/*)
  app.addHook('preHandler', async (req, reply) => {
    if (req.url.startsWith('/api/auth/')) return;
    if (!req.url.startsWith('/api/')) return;

    const session = await auth.api.getSession({
      headers: req.headers as Record<string, string>,
    });
    if (!session) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }
    (req as any).session = session;
  });

  await registerRoutes(app);
  startScheduler();

  // Seed admin user
  await seedAdminUser();

  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`Server running on http://0.0.0.0:${config.port}`);
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
