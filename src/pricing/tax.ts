import type { TaxConfig } from '../config.js';
import type { Product } from '../scraper/types.js';

export interface TaxEstimate {
  finalPrice: number;
  importTax: number;
  icms: number;
  included: boolean;
  usdBrl: number;
}

export function estimateFinalPrice(product: Product, tax: TaxConfig, usdBrl: number): TaxEstimate {
  const price = product.salePrice;
  if (tax.pricesIncludeTax || product.localWarehouse) {
    return { finalPrice: price, importTax: 0, icms: 0, included: true, usdBrl };
  }
  const priceUsd = price / usdBrl;
  const importTaxUsd =
    priceUsd <= tax.thresholdUsd
      ? priceUsd * tax.importRateUpToThreshold
      : Math.max(priceUsd * tax.importRateAboveThreshold - tax.deductionUsd, 0);
  const taxedUsd = priceUsd + importTaxUsd;
  const icmsUsd = taxedUsd / (1 - tax.icmsRate) - taxedUsd;
  const toBrl = (value: number): number => Math.round(value * usdBrl * 100) / 100;
  return {
    finalPrice: toBrl(taxedUsd + icmsUsd),
    importTax: toBrl(importTaxUsd),
    icms: toBrl(icmsUsd),
    included: false,
    usdBrl,
  };
}
