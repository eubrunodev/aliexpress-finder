import type { Page } from 'playwright';
import { isLoginUrl } from './auth.js';

export type BlockKind = 'captcha' | 'login';

const CAPTCHA_URL = /punish|captcha|_____tmd_____|x5secdata/i;
const CAPTCHA_SELECTOR =
  '#nocaptcha, .nc_wrapper, .baxia-dialog, #baxia-dialog-content, #baxia-punish, iframe[src*="punish"], iframe[src*="captcha"]';

export async function detectBlock(page: Page): Promise<BlockKind | null> {
  const url = page.url();
  if (isLoginUrl(url)) return 'login';
  if (CAPTCHA_URL.test(url)) return 'captcha';
  const matches = page.locator(CAPTCHA_SELECTOR);
  const count = await matches.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    if (await matches.nth(index).isVisible().catch(() => false)) return 'captcha';
  }
  return null;
}
