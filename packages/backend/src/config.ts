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
    'https://pvj.com.vn/index.php/TCDK/gateway/plugin/WebFeedGatewayPlugin/rss',
    'https://en.vneconomy.vn/tin-moi.rss',
  ],

  keywords: {
    include: [
      'crude oil', 'brent', 'wti', 'natural gas', 'lng', 'opec',
      'petroleum', 'fuel', 'gasoline', 'diesel', 'energy market',
      'oil price', 'gas price', 'refinery', 'pipeline', 'barrel',
      'energy crisis', 'oil production', 'shale', 'offshore',
    ],
    exclude: [
      'solar panel installation', 'electric vehicle review',
    ],
  },

  schedule: {
    crons: ['0 6 * * *', '0 12 * * *', '0 18 * * *'],
  },

  dedup: {
    similarityThreshold: 0.15,
  },

  models: {
    chat: 'google/gemini-3-flash-preview',
    embedding: 'qwen/qwen3-embedding-8b',
  },
} as const;
