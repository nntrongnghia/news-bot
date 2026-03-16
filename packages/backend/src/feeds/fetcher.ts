import Parser from 'rss-parser';
import { config } from '../config.js';
import type { RawArticle } from './types.js';

const parser = new Parser({
  timeout: 15_000,
  headers: { 'User-Agent': 'EnergyNewsBot/1.0' },
});

function matchesKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  const hasInclude = config.keywords.include.some((kw) => lower.includes(kw));
  const hasExclude = config.keywords.exclude.some((kw) => lower.includes(kw));
  return hasInclude && !hasExclude;
}

async function fetchFeed(feedUrl: string): Promise<RawArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    const sourceName = feed.title ?? new URL(feedUrl).hostname;

    const maxAgeMs = config.pipeline.maxArticleAgeHours * 60 * 60 * 1000;

    return (feed.items ?? [])
      .filter((item) => {
        const text = `${item.title ?? ''} ${item.contentSnippet ?? ''}`;
        return item.link && matchesKeywords(text);
      })
      .filter((item) => {
        if (!item.pubDate) return true; // keep articles without dates
        const age = Date.now() - new Date(item.pubDate).getTime();
        return age <= maxAgeMs;
      })
      .map((item) => ({
        url: item.link!,
        title: item.title ?? 'Untitled',
        source: sourceName,
        published: item.pubDate ? new Date(item.pubDate) : null,
        content: item.contentSnippet ?? item.content ?? '',
      }));
  } catch (err) {
    console.error(`Failed to fetch feed ${feedUrl}:`, err);
    return [];
  }
}

export async function fetchAllFeeds(): Promise<RawArticle[]> {
  const results = await Promise.allSettled(
    config.feeds.map((url) => fetchFeed(url))
  );

  const articles: RawArticle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }

  console.log(`Fetched ${articles.length} relevant articles from ${config.feeds.length} feeds`);
  return articles;
}
