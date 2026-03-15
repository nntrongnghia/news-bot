import Fastify from 'fastify';
import { config } from './config.js';
import { prisma, ensureVectorExtension } from './db/index.js';
import { registerRoutes } from './api/routes.js';
import { startScheduler } from './scheduler/jobs.js';

async function main() {
  // Ensure pgvector extension exists
  await ensureVectorExtension();

  const app = Fastify({ logger: true });

  // CORS for frontend
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      reply.status(204).send();
    }
  });

  await registerRoutes(app);
  startScheduler();

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
