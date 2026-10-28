import type { Source } from '../config.js';
import { HOME_URL, WISHLIST_URL } from '../browser/auth.js';
import { slugify } from '../util/text.js';

const SORT_PARAM: Record<string, string> = {
  default: 'default',
  orders: 'total_tranpro_desc',
  price_asc: 'price_asc',
  newest: 'create_desc',
};

export function sourceName(source: Source): string {
  if (source.name) return source.name;
  switch (source.type) {
    case 'search':
      return `Busca: ${source.keyword}`;
    case 'feed':
      return 'Para você';
    case 'wishlist':
      return 'Lista de desejos';
    case 'url':
      return new URL(source.url).hostname;
  }
}

export function sourceUrls(source: Source): { urls: string[]; scrolls: number } {
  switch (source.type) {
    case 'search': {
      const slug = slugify(source.keyword) || 'produtos';
      const text = encodeURIComponent(source.keyword);
      const sort = SORT_PARAM[source.sort];
      const urls = Array.from({ length: source.pages }, (_, index) => {
        const page = index + 1;
        return `https://pt.aliexpress.com/w/wholesale-${slug}.html?SearchText=${text}&page=${page}&g=y&SortType=${sort}`;
      });
      return { urls, scrolls: 4 };
    }
    case 'feed':
      return { urls: [HOME_URL], scrolls: source.scrolls };
    case 'wishlist':
      return { urls: [WISHLIST_URL], scrolls: source.scrolls };
    case 'url':
      return { urls: [source.url], scrolls: source.scrolls };
  }
}
