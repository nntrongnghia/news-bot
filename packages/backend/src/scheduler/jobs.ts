import cron from 'node-cron';
import { config } from '../config.js';
import { runPipeline } from '../reports/generator.js';

export function startScheduler() {
  for (const cronExpr of config.schedule.crons) {
    cron.schedule(cronExpr, async () => {
      console.log(`[Scheduler] Running pipeline at ${new Date().toISOString()}`);
      try {
        const report = await runPipeline();
        if (report) {
          console.log(`[Scheduler] Report ${report.reportKey} generated`);
        } else {
          console.log('[Scheduler] No new articles, skipping report');
        }
      } catch (err) {
        console.error('[Scheduler] Pipeline failed:', err);
      }
    });
    console.log(`[Scheduler] Registered cron: ${cronExpr}`);
  }
}
