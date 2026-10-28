import { ensureLoggedIn } from '../browser/auth.js';
import { openSession } from '../browser/session.js';
import type { Config } from '../config.js';
import { buildProductEmbed } from '../discord/embed.js';
import { sendEmbeds, sendMessage } from '../discord/webhook.js';
import { env } from '../env.js';
import { mergeFilters, passesFilters } from '../filters/match.js';
import { resolveUsdBrl } from '../pricing/rate.js';
import { estimateFinalPrice } from '../pricing/tax.js';
import { BlockedError, scrapeListing } from '../scraper/listing.js';
import { sourceName, sourceUrls } from '../scraper/sources.js';
import type { Product } from '../scraper/types.js';
import { Store } from '../storage/store.js';
import { log } from '../util/log.js';
import { chunk, pause } from '../util/random.js';
import { decide, type Decision } from './decide.js';

interface Candidate {
  product: Product;
  decision: Decision;
}

export async function runOnce(config: Config): Promise<void> {
  const webhook = env.discordWebhookUrl;
  if (!webhook) throw new Error('DISCORD_WEBHOOK_URL is missing in .env');
  const store = new Store(config.storage.file);
  try {
    const candidates = await collectCandidates(config, store, webhook);
    await notify(candidates, config, store, webhook);
  } finally {
    store.close();
  }
}

async function collectCandidates(config: Config, store: Store, webhook: string): Promise<Candidate[]> {
  const session = await openSession(config);
  const candidates = new Map<string, Candidate>();
  const blockWaitMs = config.browser.headless ? 0 : config.schedule.loginWaitMinutes * 60_000;
  const alert = (text: string) => sendMessage(webhook, text).catch((error) => log.warn(`Alert failed: ${error}`));
  let pagesVisited = 0;
  try {
    const loggedIn = await ensureLoggedIn(session.page, config, async () => {
      log.warn('Not logged in. Log in using the browser window.');
      await alert('⚠️ Sessão do AliExpress expirou. Faça login na janela do navegador do robô.');
    });
    if (!loggedIn) {
      log.error('Login not completed, skipping this run');
      return [];
    }
    for (const source of config.sources) {
      const name = sourceName(source);
      const filters = mergeFilters(config.filters, source.filters);
      const keyword = source.type === 'search' ? source.keyword : undefined;
      const { urls, scrolls } = sourceUrls(source);
      for (const url of urls) {
        if (pagesVisited >= config.schedule.maxPagesPerRun) {
          log.warn('Page budget for this run reached');
          return [...candidates.values()];
        }
        if (pagesVisited > 0) await pause(config.delays.betweenPagesMs);
        log.info(`${name}: ${url}`);
        const products = await scrapeListing(session.page, url, config, {
          source: name,
          scrolls,
          blockWaitMs,
          onBlocked: async (kind) => {
            log.warn(`Blocked by ${kind}. Resolve it in the browser window.`);
            await alert(`⚠️ Robô bloqueado (${kind}). Abra a janela do navegador e resolva para continuar.`);
          },
        });
        pagesVisited += 1;
        let kept = 0;
        for (const product of products) {
          const existing = store.get(product.id);
          store.recordSeen(product);
          if (candidates.has(product.id) || !passesFilters(product, filters, keyword)) continue;
          const decision = decide(product, existing, config.notifications);
          if (!decision) continue;
          candidates.set(product.id, { product, decision });
          kept += 1;
        }
        log.info(`${name}: ${products.length} products found, ${kept} to notify`);
      }
    }
  } catch (error) {
    if (!(error instanceof BlockedError)) throw error;
    log.error(`${error.message}. Sending what was collected so far.`);
    await alert(`⚠️ Robô bloqueado (${error.kind}) e o tempo de espera acabou. Rodada encerrada.`);
  } finally {
    await session.close();
  }
  return [...candidates.values()];
}

async function notify(candidates: Candidate[], config: Config, store: Store, webhook: string): Promise<void> {
  const selected = [...candidates]
    .sort((a, b) => (b.product.discountPercent ?? 0) - (a.product.discountPercent ?? 0))
    .slice(0, config.notifications.maxItemsPerRun);
  if (selected.length === 0) {
    log.info('Nothing new to send');
    return;
  }
  const usdBrl = await resolveUsdBrl(config.tax);
  for (const batch of chunk(selected, 10)) {
    const embeds = batch.map(({ product, decision }) =>
      buildProductEmbed(product, estimateFinalPrice(product, config.tax, usdBrl), decision),
    );
    await sendEmbeds(webhook, embeds);
    for (const { product } of batch) store.markNotified(product.id, product.salePrice);
  }
  log.info(`Sent ${selected.length} products to Discord`);
}
