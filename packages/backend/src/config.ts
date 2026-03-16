import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(8806),
  BETTER_AUTH_SECRET: z.string().min(32),
  AUTH_ADMIN_EMAIL: z.string().default('admin@local.dev'),
  AUTH_ADMIN_PASSWORD: z.string().default('changeme'),
  TRUSTED_ORIGINS: z.string().default('http://localhost:3306'),
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
      // English — Crude & Products
      'crude oil', 'brent', 'wti', 'dubai crude', 'murban', 'natural gas', 'lng', 'lpg',
      'petroleum', 'gasoline', 'diesel', 'jet fuel', 'fuel oil', 'heating oil',
      'kerosene', 'naphtha', 'condensate',
      // English — OPEC & Organizations
      'opec', 'saudi aramco', 'production quota', 'output cut', 'supply cut',
      // English — Market & Trading
      'energy market', 'oil price', 'gas price', 'oil futures', 'gas futures',
      'crack spread', 'contango', 'backwardation', 'oil inventory', 'crude inventory',
      'strategic petroleum reserve', 'oil demand', 'oil supply', 'oil export', 'oil import', 'barrel',
      // English — Infrastructure & Operations
      'refinery', 'oil pipeline', 'gas pipeline', 'lng terminal', 'drilling rig',
      'oil production', 'shale', 'offshore', 'upstream', 'downstream', 'midstream', 'tanker',
      // English — Geopolitical & Policy
      'energy crisis', 'energy sanction', 'oil sanction', 'energy security',
      'oil embargo', 'energy transition',
      // English — Nations & Regions (producers & chokepoints)
      'saudi arabia', 'russia oil', 'russia gas', 'iran oil', 'iraq oil', 'libya oil',
      'nigeria oil', 'venezuela oil', 'kuwait oil', 'uae oil', 'qatar gas', 'norway oil',
      'guyana oil', 'permian basin', 'strait of hormuz', 'suez canal', 'gulf of mexico',
      'north sea', 'caspian', 'arctic drilling', 'middle east oil', 'persian gulf',
      // Vietnamese — Nations & Regions (diacritics)
      'ả rập xê út', 'trung đông', 'biển đông', 'nga dầu', 'iran dầu',
      // Vietnamese — Nations & Regions (ASCII)
      'a rap xe ut', 'trung dong', 'bien dong',
      // Vietnam companies & projects
      'petrovietnam', 'pvn', 'evn', 'pv gas', 'petrolimex', 'pvpower', 'pvoil',
      'nghi son', 'nsrp', 'binh son', 'pvep', 'pv drilling', 'genco',
      // Vietnamese (diacritics)
      'dầu khí', 'năng lượng', 'điện lực', 'thủy điện', 'nhiệt điện', 'khí đốt',
      'xăng dầu', 'giá dầu', 'giá xăng', 'lọc dầu', 'dầu thô', 'khí thiên nhiên',
      'nhà máy lọc dầu', 'khai thác dầu', 'mỏ dầu', 'mỏ khí', 'quỹ bình ổn',
      'an ninh năng lượng', 'chuyển đổi năng lượng', 'điện khí', 'quy hoạch điện',
      // Vietnamese (ASCII normalized)
      'dau khi', 'nang luong', 'dien luc', 'thuy dien', 'nhiet dien', 'khi dot',
      'xang dau', 'gia dau', 'gia xang', 'loc dau', 'dau tho', 'khi thien nhien',
      'nha may loc dau', 'khai thac dau', 'mo dau', 'mo khi', 'quy binh on',
      'an ninh nang luong', 'chuyen doi nang luong', 'dien khi', 'quy hoach dien',
      // English-Vietnam terms
      'vietnam energy', 'vietnam oil', 'vietnam gas', 'vietnam electricity',
      'vietnam power', 'vietnam lng', 'vietnam refinery',
    ],
    exclude: [
      // English
      'cooking oil', 'olive oil', 'coconut oil', 'palm oil', 'essential oil',
      'oil painting', 'oil change', 'solar panel installation', 'electric vehicle review',
      'ev charger', 'data pipeline',
      // Vietnamese (diacritics)
      'điện thoại', 'xe điện', 'dầu ăn', 'dầu dừa', 'dầu gội', 'tinh dầu', 'điện tử',
      // Vietnamese (ASCII)
      'dau an', 'dau dua', 'dau goi', 'tinh dau', 'dien tu', 'dien thoai',
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
