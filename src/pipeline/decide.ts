import type { NotificationConfig } from '../config.js';
import type { Product } from '../scraper/types.js';
import type { StoredProduct } from '../storage/store.js';

export type Decision = { kind: 'new' } | { kind: 'drop'; previousPrice: number };

export function decide(product: Product, existing: StoredProduct | undefined, notifications: NotificationConfig): Decision | null {
  if (!existing || existing.last_notified_price === null) return { kind: 'new' };
  if (!notifications.priceDrops) return null;
  const threshold = existing.last_notified_price * (1 - notifications.minDropPercent / 100);
  if (product.salePrice <= threshold) return { kind: 'drop', previousPrice: existing.last_notified_price };
  return null;
}
