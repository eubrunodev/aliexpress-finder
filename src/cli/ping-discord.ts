import { loadConfig } from '../config.js';
import { buildProductEmbed } from '../discord/embed.js';
import { sendEmbeds } from '../discord/webhook.js';
import { env } from '../env.js';
import { estimateFinalPrice } from '../pricing/tax.js';
import type { Product } from '../scraper/types.js';
import { log } from '../util/log.js';

if (!env.discordWebhookUrl) throw new Error('DISCORD_WEBHOOK_URL is missing in .env');

const config = loadConfig();
const sample: Product = {
  id: '1005001234567890',
  title: 'Teste do robô: teclado mecânico 75% hot swap RGB',
  url: 'https://pt.aliexpress.com/item/1005001234567890.html',
  image: 'https://ae01.alicdn.com/kf/S8d1d6e2f6c0c4b1c9c9a1f1b5b9d1f5aU.jpg',
  salePrice: 189.9,
  originalPrice: 329.9,
  discountPercent: 42,
  sold: '1.000+ vendidos',
  soldCount: 1000,
  rating: 4.8,
  store: 'Loja de teste',
  choice: true,
  localWarehouse: false,
  source: 'Teste',
};

await sendEmbeds(env.discordWebhookUrl, [
  buildProductEmbed(sample, estimateFinalPrice(sample, config.tax, config.tax.usdBrl), { kind: 'new' }),
]);
log.info('Test message sent to Discord');
