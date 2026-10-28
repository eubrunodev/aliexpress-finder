import type { TaxConfig } from '../config.js';
import { log } from '../util/log.js';

const RATE_URL = 'https://economia.awesomeapi.com.br/last/USD-BRL';

export async function resolveUsdBrl(tax: TaxConfig): Promise<number> {
  if (!tax.fetchUsdRate) return tax.usdBrl;
  try {
    const response = await fetch(RATE_URL, { signal: AbortSignal.timeout(8000) });
    const data = (await response.json()) as { USDBRL?: { bid?: string } };
    const bid = Number(data.USDBRL?.bid);
    if (Number.isFinite(bid) && bid > 0) return bid;
  } catch (error) {
    log.warn(`USD/BRL rate fetch failed, using ${tax.usdBrl}: ${(error as Error).message}`);
  }
  return tax.usdBrl;
}
