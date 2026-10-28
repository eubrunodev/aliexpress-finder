import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Product } from '../scraper/types.js';

export interface StoredProduct {
  id: string;
  title: string;
  sale_price: number;
  original_price: number | null;
  first_seen: string;
  last_seen: string;
  last_notified_price: number | null;
  notified_at: string | null;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sale_price REAL NOT NULL,
    original_price REAL,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    last_notified_price REAL,
    notified_at TEXT
  );
  CREATE TABLE IF NOT EXISTS price_history (
    product_id TEXT NOT NULL,
    price REAL NOT NULL,
    seen_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS price_history_product ON price_history (product_id, seen_at);
`;

export class Store {
  private readonly db: DatabaseSync;

  constructor(file: string) {
    const path = resolve(process.cwd(), file);
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(SCHEMA);
  }

  get(id: string): StoredProduct | undefined {
    return this.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as StoredProduct | undefined;
  }

  recordSeen(product: Product): void {
    const now = new Date().toISOString();
    const existing = this.get(product.id);
    this.db
      .prepare(
        `INSERT INTO products (id, title, sale_price, original_price, first_seen, last_seen)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           sale_price = excluded.sale_price,
           original_price = excluded.original_price,
           last_seen = excluded.last_seen`,
      )
      .run(product.id, product.title, product.salePrice, product.originalPrice ?? null, now, now);
    if (!existing || existing.sale_price !== product.salePrice) {
      this.db
        .prepare('INSERT INTO price_history (product_id, price, seen_at) VALUES (?, ?, ?)')
        .run(product.id, product.salePrice, now);
    }
  }

  markNotified(id: string, price: number): void {
    this.db
      .prepare('UPDATE products SET last_notified_price = ?, notified_at = ? WHERE id = ?')
      .run(price, new Date().toISOString(), id);
  }

  close(): void {
    this.db.close();
  }
}
