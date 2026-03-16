import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(8000),
  BETTER_AUTH_SECRET: z.string().min(32),
  AUTH_ADMIN_EMAIL: z.string().default('admin@local.dev'),
  AUTH_ADMIN_PASSWORD: z.string().default('changeme'),
  TRUSTED_ORIGINS: z.string().default('http://localhost:3000'),
  PIPELINE_API_KEY: z.string().min(16),
});

const env = envSchema.parse(process.env);

export const config = {
  openrouterApiKey: env.OPENROUTER_API_KEY,
  databaseUrl: env.DATABASE_URL,
  port: env.PORT,
  betterAuthSecret: env.BETTER_AUTH_SECRET,
  authAdminEmail: env.AUTH_ADMIN_EMAIL,
  authAdminPassword: env.AUTH_ADMIN_PASSWORD,
  trustedOrigins: env.TRUSTED_ORIGINS.split(',').map((s) => s.trim()),
  pipelineApiKey: env.PIPELINE_API_KEY,

  feeds: [
    'https://oilprice.com/rss/main',
    'https://www.oilandgas360.com/feed',
    'https://www.cnbc.com/id/19836768/device/rss/rss.html',
    'https://www.investing.com/rss/news.rss',
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://www.ft.com/global-economy?format=rss',
    'https://en.vneconomy.vn/tin-moi.rss',
    'https://petrotimes.vn/rss_feed/trang-chu',
    'https://nangluongvietnam.vn/rss_feed/',
    'https://vnexpress.net/rss/kinh-doanh.rss',
    'https://vnexpress.net/rss/thoi-su.rss',
    'https://vnexpress.net/rss/the-gioi.rss',
    'https://vnexpress.net/rss/tin-noi-bat.rss',
    'https://thanhnien.vn/rss/thoi-su.rss',
    'https://thanhnien.vn/rss/the-gioi.rss',
    'https://thanhnien.vn/rss/kinh-te.rss',
    'https://tuoitre.vn/rss/the-gioi.rss',
    'https://tuoitre.vn/rss/kinh-doanh.rss',
    'https://tuoitre.vn/rss/thoi-su.rss',
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

  pipeline: {
    maxArticleAgeHours: 48,
  },

  extraction: {
    timeoutMs: 20_000,
    maxContentLength: 50_000,
    concurrency: 5,
  },

  models: {
    chat: 'google/gemini-3-flash-preview',
    summarize: 'google/gemini-2.5-flash-lite',
    embedding: 'qwen/qwen3-embedding-8b',
  },
} as const;
