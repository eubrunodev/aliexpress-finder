import type { Page } from 'playwright';
import type { Config } from '../config.js';
import { detectBlock, type BlockKind } from '../browser/guard.js';
import { autoScroll } from '../browser/scroll.js';
import { cardToProduct, extractDomCards } from './dom.js';
import { extractStructuredItems, structuredToProduct } from './structured.js';
import type { Product } from './types.js';
import { pause, sleep } from '../util/random.js';

export class BlockedError extends Error {
  constructor(
    public readonly kind: BlockKind,
    public readonly url: string,
  ) {
    super(`Blocked by ${kind} at ${url}`);
  }
}

export interface ListingOptions {
  source: string;
  scrolls: number;
  blockWaitMs: number;
  onBlocked?: (kind: BlockKind) => Promise<void>;
}

export async function scrapeListing(page: Page, url: string, config: Config, options: ListingOptions): Promise<Product[]> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await pause(config.delays.scrollPauseMs);
    const kind = await detectBlock(page);
    if (!kind) break;
    if (attempt === 1) throw new BlockedError(kind, page.url());
    await waitForUnblock(page, kind, options);
  }
  await autoScroll(page, options.scrolls, config.delays.scrollPauseMs);
  const byId = new Map<string, Product>();
  for (const item of await extractStructuredItems(page)) {
    const product = structuredToProduct(item, options.source);
    if (product && !byId.has(product.id)) byId.set(product.id, product);
  }
  for (const card of await extractDomCards(page)) {
    if (byId.has(card.id)) continue;
    const product = cardToProduct(card, options.source);
    if (product) byId.set(product.id, product);
  }
  return [...byId.values()];
}

async function waitForUnblock(page: Page, kind: BlockKind, options: ListingOptions): Promise<void> {
  if (options.onBlocked) await options.onBlocked(kind);
  const deadline = Date.now() + options.blockWaitMs;
  while (Date.now() < deadline) {
    await sleep(10_000);
    if (!(await detectBlock(page))) return;
  }
  throw new BlockedError(kind, page.url());
}
