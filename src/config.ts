import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const rangeSchema = z.tuple([z.number().int().min(0), z.number().int().min(0)]);

const filtersSchema = z.object({
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minDiscountPercent: z.number().min(0).max(100).optional(),
  minRating: z.number().min(0).max(5).optional(),
  minSold: z.number().int().min(0).optional(),
  excludeWords: z.array(z.string()).optional(),
  requireKeywordInTitle: z.boolean().optional(),
});

const sourceCommon = {
  name: z.string().optional(),
  filters: filtersSchema.optional(),
};

const sourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('search'),
    keyword: z.string().min(1),
    pages: z.number().int().min(1).max(5).default(1),
    sort: z.enum(['default', 'orders', 'price_asc', 'newest']).default('default'),
    ...sourceCommon,
  }),
  z.object({
    type: z.literal('feed'),
    scrolls: z.number().int().min(0).max(40).default(6),
    ...sourceCommon,
  }),
  z.object({
    type: z.literal('wishlist'),
    scrolls: z.number().int().min(0).max(40).default(3),
    ...sourceCommon,
  }),
  z.object({
    type: z.literal('url'),
    url: z.string().url(),
    scrolls: z.number().int().min(0).max(40).default(3),
    ...sourceCommon,
  }),
]);

const configSchema = z.object({
  browser: z
    .object({
      headless: z.boolean().default(false),
      offscreen: z.boolean().default(false),
      channel: z.enum(['chrome', 'msedge', 'chromium']).default('chrome'),
      profileDir: z.string().default('data/profile'),
    })
    .default({}),
  schedule: z
    .object({
      intervalMinutes: z.number().min(5).default(90),
      jitterMinutes: z.number().min(0).default(15),
      maxPagesPerRun: z.number().int().min(1).default(12),
      loginWaitMinutes: z.number().min(1).default(30),
    })
    .default({}),
  delays: z
    .object({
      betweenPagesMs: rangeSchema.default([4000, 9000]),
      scrollPauseMs: rangeSchema.default([700, 1500]),
    })
    .default({}),
  filters: filtersSchema.default({}),
  notifications: z
    .object({
      priceDrops: z.boolean().default(true),
      minDropPercent: z.number().min(0).max(100).default(10),
      maxItemsPerRun: z.number().int().min(1).max(50).default(20),
    })
    .default({}),
  tax: z
    .object({
      pricesIncludeTax: z.boolean().default(true),
      fetchUsdRate: z.boolean().default(true),
      usdBrl: z.number().positive().default(5.5),
      icmsRate: z.number().min(0).max(0.99).default(0.2),
      importRateUpToThreshold: z.number().min(0).max(5).default(0),
      importRateAboveThreshold: z.number().min(0).max(5).default(0.6),
      thresholdUsd: z.number().min(0).default(50),
      deductionUsd: z.number().min(0).default(30),
    })
    .default({}),
  storage: z
    .object({
      file: z.string().default('data/promo.sqlite'),
    })
    .default({}),
  sources: z.array(sourceSchema).min(1),
});

export type Config = z.infer<typeof configSchema>;
export type Source = Config['sources'][number];
export type Filters = z.infer<typeof filtersSchema>;
export type TaxConfig = Config['tax'];
export type NotificationConfig = Config['notifications'];

export function loadConfig(file = 'config.json'): Config {
  const path = resolve(process.cwd(), file);
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const result = configSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    throw new Error(`Invalid ${file}:\n${issues.join('\n')}`);
  }
  return result.data;
}
