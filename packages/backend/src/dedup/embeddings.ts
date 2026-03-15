import OpenAI from 'openai';
import { config } from '../config.js';
import { prisma } from '../db/index.js';
import type { RawArticle } from '../feeds/types.js';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: config.openrouterApiKey,
});

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await openai.embeddings.create({
    model: config.models.embedding,
    input: texts,
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function vectorToString(vec: number[]): string {
  return `[${vec.join(',')}]`;
}

async function isDuplicateInDb(embedding: number[]): Promise<boolean> {
  const vecStr = vectorToString(embedding);
  const threshold = config.dedup.similarityThreshold;

  const results = await prisma.$queryRaw<{ id: number; distance: number }[]>`
    SELECT id, embedding <=> ${vecStr}::vector AS distance
    FROM articles
    WHERE embedding IS NOT NULL
      AND embedding <=> ${vecStr}::vector < ${threshold}
    ORDER BY distance
    LIMIT 1
  `;

  return results.length > 0;
}

export interface DeduplicatedArticle extends RawArticle {
  embedding: number[];
}

export async function deduplicateArticles(
  articles: RawArticle[]
): Promise<DeduplicatedArticle[]> {
  if (articles.length === 0) return [];

  // URL dedup against DB
  const existingUrls = await prisma.article.findMany({
    where: { url: { in: articles.map((a) => a.url) } },
    select: { url: true },
  });
  const existingUrlSet = new Set(existingUrls.map((a) => a.url));
  const urlUnique = articles.filter((a) => !existingUrlSet.has(a.url));

  if (urlUnique.length === 0) {
    console.log('All articles already exist by URL');
    return [];
  }

  console.log(`${urlUnique.length} articles after URL dedup`);

  // Generate embeddings
  const texts = urlUnique.map((a) => `${a.title}\n${a.content}`.slice(0, 8000));
  const embeddings = await getEmbeddings(texts);

  const unique: DeduplicatedArticle[] = [];
  const batchEmbeddings: number[][] = [];

  for (let i = 0; i < urlUnique.length; i++) {
    const embedding = embeddings[i];

    // Check against DB
    const dbDup = await isDuplicateInDb(embedding);
    if (dbDup) continue;

    // Check against current batch (in-memory)
    const threshold = 1 - config.dedup.similarityThreshold;
    const batchDup = batchEmbeddings.some(
      (be) => cosineSimilarity(be, embedding) > threshold
    );
    if (batchDup) continue;

    unique.push({ ...urlUnique[i], embedding });
    batchEmbeddings.push(embedding);
  }

  console.log(`${unique.length} articles after embedding dedup`);
  return unique;
}

export async function storeArticleWithEmbedding(
  article: DeduplicatedArticle
): Promise<number> {
  const created = await prisma.article.create({
    data: {
      url: article.url,
      title: article.title,
      source: article.source,
      published: article.published,
      content: article.content,
    },
  });

  const vecStr = vectorToString(article.embedding);
  await prisma.$executeRaw`
    UPDATE articles SET embedding = ${vecStr}::vector WHERE id = ${created.id}
  `;

  return created.id;
}
