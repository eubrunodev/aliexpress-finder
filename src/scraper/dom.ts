import type { Page } from 'playwright';
import { normalizeImageUrl } from './image.js';
import { extractPrices } from './price.js';
import type { Product } from './types.js';
import { parseSoldCount } from '../util/text.js';

export interface RawCard {
  id: string;
  href: string;
  title: string;
  image: string;
  text: string;
}

export async function extractDomCards(page: Page): Promise<RawCard[]> {
  return page.evaluate(() => {
    const seen = new Set<string>();
    const cards: RawCard[] = [];
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/item/"]'));
    for (const anchor of anchors) {
      const id = anchor.href.match(/\/item\/(\d+)\.html/)?.[1];
      if (!id || seen.has(id)) continue;
      let node: HTMLElement | null = anchor;
      let depth = 0;
      while (node && depth < 6 && !/R\$/.test(node.innerText)) {
        node = node.parentElement;
        depth += 1;
      }
      if (!node || !/R\$/.test(node.innerText)) continue;
      const ids = new Set(
        Array.from(node.querySelectorAll<HTMLAnchorElement>('a[href*="/item/"]'))
          .map((a) => a.href.match(/\/item\/(\d+)\.html/)?.[1])
          .filter((value): value is string => value !== undefined),
      );
      if (ids.size > 1) continue;
      const img = node.querySelector('img');
      const heading = node.querySelector('h1, h2, h3, h4');
      const title = (heading?.textContent || img?.getAttribute('alt') || anchor.getAttribute('title') || '')
        .replace(/\s+/g, ' ')
        .trim();
      const image = img?.getAttribute('src') || img?.getAttribute('data-src') || '';
      seen.add(id);
      cards.push({ id, href: anchor.href, title, image, text: node.innerText.replace(/\s+/g, ' ').trim() });
    }
    return cards;
  });
}

export function cardToProduct(card: RawCard, source: string): Product | null {
  const body = card.title ? card.text.replace(card.title, ' ') : card.text;
  const prices = extractPrices(body);
  if (prices.length === 0) return null;
  const salePrice = prices[0];
  const higher = prices.slice(1).filter((price) => price > salePrice);
  const originalPrice = higher.length > 0 ? Math.max(...higher) : undefined;
  const explicitDiscount = body.match(/-(\d{1,2})%/);
  const discountPercent = explicitDiscount
    ? Number(explicitDiscount[1])
    : originalPrice
      ? Math.round((1 - salePrice / originalPrice) * 100)
      : undefined;
  const ratings = [...body.matchAll(/(?:^|\s)([1-5][.,]\d)(?=\s|$)/g)];
  const rating = ratings.length > 0 ? Number(ratings[ratings.length - 1][1].replace(',', '.')) : undefined;
  const soldMatch = body.match(/([\d.,]+\s?(?:mil|k)?\+?)\s*vendid/i);
  const sold = soldMatch ? `${soldMatch[1].trim()} vendidos` : undefined;
  return {
    id: card.id,
    title: card.title || `Produto ${card.id}`,
    url: `https://pt.aliexpress.com/item/${card.id}.html`,
    image: normalizeImageUrl(card.image),
    salePrice,
    originalPrice,
    discountPercent,
    sold,
    soldCount: parseSoldCount(sold),
    rating,
    choice: /\bChoice\b/.test(body),
    localWarehouse: /brasil/i.test(body) && /envi|armaz|local|estoque/i.test(body),
    source,
  };
}
