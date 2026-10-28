export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function slugify(text: string): string {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function parseSoldCount(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const match = normalize(text).match(/([\d.,]+)\s*(mil|k)?/);
  if (!match) return undefined;
  const value = Number(match[1].replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(value)) return undefined;
  return Math.round(match[2] ? value * 1000 : value);
}
