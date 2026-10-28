import type { Page } from 'playwright';
import { normalizeImageUrl } from './image.js';
import { parseMoney } from './price.js';
import type { Product } from './types.js';
import { parseSoldCount } from '../util/text.js';

type Item = Record<string, any>;

export async function extractStructuredItems(page: Page): Promise<Item[]> {
  return page.evaluate(() => {
    const globals = window as unknown as Record<string, unknown>;
    const roots = ['_dida_config_', 'runParams', '__AER_DATA__', '__INIT_DATA__', '__NEXT_DATA__']
      .map((key) => globals[key])
      .filter(Boolean);
    const found: unknown[] = [];
    const seen = new Set<unknown>();
    const stack: unknown[] = [...roots];
    let steps = 0;
    while (stack.length > 0 && steps < 300000) {
      steps += 1;
      const value = stack.pop();
      if (!value || typeof value !== 'object' || seen.has(value)) continue;
      seen.add(value);
      if (Array.isArray(value)) {
        for (const entry of value) stack.push(entry);
        continue;
      }
      const record = value as Record<string, unknown>;
      if ('productId' in record && ('prices' in record || 'title' in record)) {
        found.push(record);
        continue;
      }
      for (const key of Object.keys(record)) stack.push(record[key]);
    }
    try {
      return JSON.parse(JSON.stringify(found));
    } catch {
      return [];
    }
  });
}

export function structuredToProduct(item: Item, source: string): Product | null {
  const id = String(item.productId ?? '');
  if (!/^\d+$/.test(id)) return null;
  const prices = item.prices ?? {};
  const salePrice =
    parseMoney(prices.salePrice?.minPrice) ??
    parseMoney(prices.salePrice?.formattedPrice) ??
    parseMoney(item.salePrice);
  if (salePrice === undefined || salePrice <= 0) return null;
  const originalRaw = parseMoney(prices.originalPrice?.minPrice) ?? parseMoney(prices.originalPrice?.formattedPrice);
  const discountRaw = parseMoney(prices.salePrice?.discount);
  const originalPrice =
    originalRaw !== undefined && originalRaw > salePrice
      ? originalRaw
      : discountRaw !== undefined && discountRaw > 0 && discountRaw < 100
        ? Math.round((salePrice / (1 - discountRaw / 100)) * 100) / 100
        : undefined;
  const discountPercent =
    discountRaw !== undefined && discountRaw > 0
      ? Math.round(discountRaw)
      : originalPrice
        ? Math.round((1 - salePrice / originalPrice) * 100)
        : undefined;
  const titleValue = item.title;
  const title = String(
    typeof titleValue === 'string' ? titleValue : (titleValue?.displayTitle ?? titleValue?.seoTitle ?? ''),
  ).trim();
  const sold = typeof item.trade?.tradeDesc === 'string' ? item.trade.tradeDesc.replace(/\s+/g, ' ').trim() : undefined;
  const rating = parseMoney(item.evaluation?.starRating);
  const serialized = JSON.stringify(item).toLowerCase();
  return {
    id,
    title: title || `Produto ${id}`,
    url: `https://pt.aliexpress.com/item/${id}.html`,
    image: normalizeImageUrl(item.image?.imgUrl),
    salePrice,
    originalPrice,
    discountPercent,
    sold,
    soldCount: parseSoldCount(sold),
    rating: rating !== undefined && rating <= 5 ? rating : undefined,
    store: typeof item.store?.storeName === 'string' ? item.store.storeName : undefined,
    choice: /"ischoice":"?true"?/.test(serialized) || serialized.includes('"choice"'),
    localWarehouse: /brasil|brazil/.test(JSON.stringify(item.logistics ?? item.sellingPoints ?? '').toLowerCase()),
    source,
  };
}
