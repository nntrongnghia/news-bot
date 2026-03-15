import OpenAI from 'openai';
import { config } from '../config.js';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: config.openrouterApiKey,
});

interface ArticleForAnalysis {
  id: number;
  title: string;
  content: string | null;
  source: string | null;
}

interface ArticleSummary {
  id: number;
  summary: string;
}

export interface Synthesis {
  keyDevelopments: string[];
  priceDrivers: string[];
  supplyDemandSignals: string[];
  geopoliticalFactors: string[];
  outlook: string;
}

export async function summarizeArticles(
  articles: ArticleForAnalysis[]
): Promise<ArticleSummary[]> {
  const summaries: ArticleSummary[] = [];

  // Process in batches of 5 to avoid rate limits
  for (let i = 0; i < articles.length; i += 5) {
    const batch = articles.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (article) => {
        const response = await openai.chat.completions.create({
          model: config.models.chat,
          messages: [
            {
              role: 'system',
              content:
                'Bạn là một chuyên gia phân tích thị trường năng lượng cao cấp. Hãy tóm tắt bài viết sau trong 4-5 câu bằng tiếng Việt, tập trung vào tác động thị trường, ảnh hưởng đến giá cả, và động lực cung/cầu.',
            },
            {
              role: 'user',
              content: `Title: ${article.title}\nSource: ${article.source ?? 'Unknown'}\n\n${article.content ?? 'No content available.'}`,
            },
          ],
          max_tokens: 300,
        });

        return {
          id: article.id,
          summary: response.choices[0]?.message?.content ?? 'Summary unavailable.',
        };
      })
    );
    summaries.push(...results);
  }

  return summaries;
}

export async function synthesizeReport(
  summaries: { title: string; summary: string; source: string | null }[]
): Promise<Synthesis> {
  const articleBlock = summaries
    .map((s, i) => `[${i + 1}] ${s.title} (${s.source ?? 'Unknown'})\n${s.summary}`)
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: config.models.chat,
    messages: [
      {
        role: 'system',
        content: `Bạn là một chuyên gia phân tích thị trường năng lượng cao cấp, chuyên về dầu thô, khí đốt tự nhiên và thị trường nhiên liệu. Hãy phân tích các tóm tắt bài viết sau và tạo báo cáo tình báo thị trường có cấu trúc bằng tiếng Việt.

Trả lời bằng JSON với cấu trúc chính xác sau:
{
  "keyDevelopments": ["..."],
  "priceDrivers": ["..."],
  "supplyDemandSignals": ["..."],
  "geopoliticalFactors": ["..."],
  "outlook": "..."
}

Mỗi mảng nên có 2-5 điểm ngắn gọn bằng tiếng Việt. Phần outlook nên là 2-3 câu bằng tiếng Việt.`,
      },
      {
        role: 'user',
        content: articleBlock,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  return JSON.parse(content) as Synthesis;
}
