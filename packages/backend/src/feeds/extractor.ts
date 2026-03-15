import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { config } from '../config.js';
import type { DeduplicatedArticle } from '../dedup/embeddings.js';

async function extractContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(config.extraction.timeoutMs),
      headers: { 'User-Agent': 'EnergyNewsBot/1.0' },
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) return null;

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    return article?.textContent?.trim() ?? null;
  } catch (err) {
    console.error(`Failed to extract content from ${url}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function extractFullContent(
  articles: DeduplicatedArticle[]
): Promise<DeduplicatedArticle[]> {
  const { concurrency, maxContentLength } = config.extraction;
  let enrichedCount = 0;

  const results: DeduplicatedArticle[] = [];

  for (let i = 0; i < articles.length; i += concurrency) {
    const batch = articles.slice(i, i + concurrency);
    const extracted = await Promise.all(
      batch.map(async (article) => {
        const fullContent = await extractContent(article.url);

        if (fullContent && fullContent.length > article.content.length) {
          enrichedCount++;
          return {
            ...article,
            content: fullContent.slice(0, maxContentLength),
          };
        }

        return article;
      })
    );
    results.push(...extracted);
  }

  console.log(`Content extraction: ${enrichedCount}/${articles.length} articles enriched`);
  return results;
}
