export function normalizeImageUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw.trim() === '') return undefined;
  let url = raw.trim();
  if (url.startsWith('//')) url = `https:${url}`;
  if (!/^https?:\/\//.test(url)) return undefined;
  return url.replace(/_\.(avif|webp)$/i, '');
}
