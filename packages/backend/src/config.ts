import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(8000),
});

const env = envSchema.parse(process.env);

export const config = {
  openrouterApiKey: env.OPENROUTER_API_KEY,
  databaseUrl: env.DATABASE_URL,
  port: env.PORT,

  feeds: [
    'https://oilprice.com/rss/main',
    'https://www.oilandgas360.com/feed',
    'https://www.cnbc.com/id/19836768/device/rss/rss.html',
    'https://www.investing.com/rss/news.rss',
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://www.ft.com/global-economy?format=rss',
    'https://en.vneconomy.vn/tin-moi.rss',
    // Vietnam energy feeds
    'https://petrotimes.vn/rss_feed/trang-chu',
    'https://nangluongvietnam.vn/rss_feed/',
    'https://vnexpress.net/rss/kinh-doanh.rss',
  ],

  keywords: {
    include: [
      'crude oil', 'brent', 'wti', 'natural gas', 'lng', 'opec',
      'petroleum', 'fuel', 'gasoline', 'diesel', 'energy market',
      'oil price', 'gas price', 'refinery', 'pipeline', 'barrel',
      'energy crisis', 'oil production', 'shale', 'offshore',
      // Vietnam companies
      'petrovietnam', 'pvn', 'evn', 'pv gas', 'petrolimex', 'pvpower', 'pvoil',
      // Vietnamese terms (with diacritics)
      'dầu khí', 'năng lượng', 'điện lực', 'thủy điện', 'nhiệt điện', 'khí đốt',
      // Vietnamese terms (ASCII)
      'dau khi', 'nang luong', 'dien luc', 'thuy dien', 'nhiet dien',
      // English Vietnam terms
      'vietnam energy', 'vietnam oil', 'vietnam gas', 'vietnam electricity', 'vietnam power', 'vietnam lng',
    ],
    exclude: [
      'solar panel installation', 'electric vehicle review',
      'điện thoại', 'xe điện',
    ],
  },

  schedule: {
    crons: ['0 6 * * *', '0 12 * * *', '0 18 * * *'],
  },

  dedup: {
    similarityThreshold: 0.15,
  },

  extraction: {
    timeoutMs: 20_000,
    maxContentLength: 15_000,
    concurrency: 5,
  },

  models: {
    chat: 'google/gemini-3-flash-preview',
    embedding: 'qwen/qwen3-embedding-8b',
  },
} as const;
