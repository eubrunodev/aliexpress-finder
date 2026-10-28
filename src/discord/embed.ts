import type { Decision } from '../pipeline/decide.js';
import type { TaxEstimate } from '../pricing/tax.js';
import type { Product } from '../scraper/types.js';
import { formatBRL } from '../util/money.js';
import { truncate } from '../util/text.js';
import type { Embed } from './webhook.js';

const COLOR_DROP = 0xf1c40f;
const COLOR_HOT = 0xe74c3c;
const COLOR_NEW = 0x2ecc71;

export function buildProductEmbed(product: Product, estimate: TaxEstimate, decision: Decision): Embed {
  const discount = product.discountPercent;
  const color = decision.kind === 'drop' ? COLOR_DROP : (discount ?? 0) >= 50 ? COLOR_HOT : COLOR_NEW;
  const status = decision.kind === 'drop' ? `Caiu de ${formatBRL(decision.previousPrice)}` : 'Novo';
  const tags = [product.source, status, product.choice ? 'Choice' : null, product.localWarehouse ? 'Enviado do Brasil' : null];
  return {
    title: truncate(product.title, 240),
    url: product.url,
    color,
    thumbnail: product.image ? { url: product.image } : undefined,
    fields: [
      { name: 'Preço original', value: product.originalPrice ? `~~${formatBRL(product.originalPrice)}~~` : 'n/d', inline: true },
      { name: 'Preço promo', value: `**${formatBRL(product.salePrice)}**`, inline: true },
      { name: 'Desconto', value: discount !== undefined ? `${discount}%` : 'n/d', inline: true },
      { name: 'Valor final estimado', value: finalPriceLine(estimate), inline: false },
      { name: 'Vendidos', value: product.sold ?? 'n/d', inline: true },
      { name: 'Avaliação', value: product.rating !== undefined ? `${product.rating.toFixed(1)} ★` : 'n/d', inline: true },
      { name: 'Loja', value: product.store ? truncate(product.store, 60) : 'n/d', inline: true },
    ],
    footer: { text: tags.filter(Boolean).join(' · ') },
    timestamp: new Date().toISOString(),
  };
}

function finalPriceLine(estimate: TaxEstimate): string {
  if (estimate.included) return `**${formatBRL(estimate.finalPrice)}** (impostos já inclusos no preço)`;
  return [
    `**${formatBRL(estimate.finalPrice)}**`,
    `Importação ${formatBRL(estimate.importTax)} + ICMS ${formatBRL(estimate.icms)} · câmbio ${estimate.usdBrl.toFixed(2)}`,
  ].join('\n');
}
