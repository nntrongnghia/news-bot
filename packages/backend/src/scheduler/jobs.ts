import cron from 'node-cron';
import { config } from '../config.js';
import { runPipeline } from '../reports/generator.js';
import { prisma } from '../db/index.js';

export function startScheduler() {
  for (const cronExpr of config.schedule.crons) {
    cron.schedule(cronExpr, async () => {
      console.log(`[Scheduler] Running pipeline at ${new Date().toISOString()}`);
      const log = await prisma.pipelineLog.create({
        data: { trigger: 'cron', cronExpr, status: 'running' },
      });
      try {
        const report = await runPipeline();
        if (report) {
          console.log(`[Scheduler] Report ${report.reportKey} generated`);
          await prisma.pipelineLog.update({
            where: { id: log.id },
            data: {
              status: 'success',
              finishedAt: new Date(),
              articleCount: report.articleCount,
              reportId: report.id,
            },
          });
        } else {
          console.log('[Scheduler] No new articles, skipping report');
          await prisma.pipelineLog.update({
            where: { id: log.id },
            data: { status: 'skipped', finishedAt: new Date() },
          });
        }
      } catch (err) {
        console.error('[Scheduler] Pipeline failed:', err);
        await prisma.pipelineLog.update({
          where: { id: log.id },
          data: {
            status: 'error',
            finishedAt: new Date(),
            error: err instanceof Error ? err.message : String(err),
          },
        });
      }
    });
    console.log(`[Scheduler] Registered cron: ${cronExpr}`);
  }
}
