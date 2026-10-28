const PRICE_RE = /R\$\s?(\d{1,3}(?:\.\d{3})+|\d+)(?:\s?,\s?(\d{1,2}))?/g;
const LOOSE_RE = /(\d{1,3}(?:\.\d{3})+|\d+)(?:[.,](\d{1,2}))?/;

export function extractPrices(text: string): number[] {
  const prices: number[] = [];
  for (const match of text.replace(/\s+/g, ' ').matchAll(PRICE_RE)) {
    prices.push(toAmount(match[1], match[2]));
  }
  return prices;
}

export function parseMoney(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const plain = Number(value);
  if (Number.isFinite(plain)) return plain;
  const match = value.match(LOOSE_RE);
  return match ? toAmount(match[1], match[2]) : undefined;
}

function toAmount(whole: string, cents: string | undefined): number {
  return Number(`${whole.replace(/\./g, '')}.${(cents ?? '0').padEnd(2, '0')}`);
}
