import { prisma } from '../db/index.js';
import { fetchAllFeeds } from '../feeds/fetcher.js';
import {
  deduplicateArticles,
  storeArticleWithEmbedding,
} from '../dedup/embeddings.js';
import { extractFullContent } from '../feeds/extractor.js';
import { summarizeArticles, synthesizeReport } from '../analysis/analyzer.js';
import type { Synthesis } from '../analysis/analyzer.js';

export interface GeneratedReport {
  id: number;
  reportKey: string;
  generatedAt: Date;
  articleCount: number;
  synthesis: Synthesis;
}

export async function runPipeline(): Promise<GeneratedReport> {
  console.log('--- Pipeline started ---');

  // 1. Fetch RSS feeds
  const rawArticles = await fetchAllFeeds();

  // 2. Deduplicate (URL + embedding)
  const uniqueArticles = await deduplicateArticles(rawArticles);

  if (uniqueArticles.length === 0) {
    console.log('No new unique articles found');
    // Create an empty report
    const now = new Date();
    const reportKey = `report-${now.toISOString().slice(0, 13).replace(/[T:]/g, '-')}`;
    const report = await prisma.report.create({
      data: {
        reportKey,
        periodStart: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        periodEnd: now,
        articleCount: 0,
        synthesis: {
          keyDevelopments: [],
          priceDrivers: [],
          supplyDemandSignals: [],
          geopoliticalFactors: [],
          outlook: 'No new articles found in this period.',
        },
      },
    });

    return {
      id: report.id,
      reportKey: report.reportKey,
      generatedAt: report.generatedAt,
      articleCount: 0,
      synthesis: report.synthesis as unknown as Synthesis,
    };
  }

  // 3. Extract full article content
  const enrichedArticles = await extractFullContent(uniqueArticles);

  // 4. Store articles with embeddings
  const articleIds: number[] = [];
  for (const article of enrichedArticles) {
    const id = await storeArticleWithEmbedding(article);
    articleIds.push(id);
  }

  // 5. Fetch stored articles for analysis
  const storedArticles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
  });

  // 6. Summarize each article
  const summaries = await summarizeArticles(
    storedArticles.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      source: a.source,
    }))
  );

  // Update articles with summaries
  await Promise.all(
    summaries.map((s) =>
      prisma.article.update({
        where: { id: s.id },
        data: { summary: s.summary },
      })
    )
  );

  // 7. Synthesize report
  const synthesis = await synthesizeReport(
    storedArticles.map((a) => ({
      title: a.title,
      summary: summaries.find((s) => s.id === a.id)?.summary ?? '',
      source: a.source,
    }))
  );

  // 8. Create report and link articles
  const now = new Date();
  const reportKey = `report-${now.toISOString().slice(0, 13).replace(/[T:]/g, '-')}`;
  const report = await prisma.report.create({
    data: {
      reportKey,
      periodStart: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      periodEnd: now,
      articleCount: articleIds.length,
      synthesis: synthesis as object,
      articles: {
        connect: articleIds.map((id) => ({ id })),
      },
    },
  });

  console.log(`--- Pipeline complete: ${report.reportKey} with ${articleIds.length} articles ---`);

  return {
    id: report.id,
    reportKey: report.reportKey,
    generatedAt: report.generatedAt,
    articleCount: articleIds.length,
    synthesis,
  };
}
