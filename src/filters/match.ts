import type { Filters } from '../config.js';
import type { Product } from '../scraper/types.js';
import { normalize } from '../util/text.js';

export function mergeFilters(base: Filters, override?: Filters): Filters {
  const merged: Filters = { ...base };
  for (const [key, value] of Object.entries(override ?? {})) {
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}

export function passesFilters(product: Product, filters: Filters, keyword?: string): boolean {
  if (filters.minPrice !== undefined && product.salePrice < filters.minPrice) return false;
  if (filters.maxPrice !== undefined && product.salePrice > filters.maxPrice) return false;
  if (filters.minDiscountPercent !== undefined && (product.discountPercent ?? 0) < filters.minDiscountPercent) return false;
  if (filters.minRating !== undefined && (product.rating ?? 0) < filters.minRating) return false;
  if (filters.minSold !== undefined && (product.soldCount ?? 0) < filters.minSold) return false;
  const title = normalize(product.title);
  if ((filters.excludeWords ?? []).some((word) => title.includes(normalize(word)))) return false;
  if (filters.requireKeywordInTitle && keyword) {
    const words = normalize(keyword)
      .split(/\s+/)
      .filter((word) => word.length >= 3);
    if (!words.every((word) => title.includes(word))) return false;
  }
  return true;
}
