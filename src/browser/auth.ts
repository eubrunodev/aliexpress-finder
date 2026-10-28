import type { Page } from 'playwright';
import type { Config } from '../config.js';

export const HOME_URL = 'https://pt.aliexpress.com/';
export const LOGIN_URL = 'https://login.aliexpress.com/';
export const WISHLIST_URL = 'https://www.aliexpress.com/p/wish-manage/index.html';

const LOGIN_HOST = /(^|\.)(login|passport)\.aliexpress\.com$/i;

export function isLoginUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return LOGIN_HOST.test(parsed.hostname) || /\/login\b/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  await page.goto(WISHLIST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(2500);
  return !isLoginUrl(page.url());
}

export async function ensureLoggedIn(page: Page, config: Config, onNeedLogin: () => Promise<void>): Promise<boolean> {
  if (await isLoggedIn(page)) return true;
  if (config.browser.headless) return false;
  await onNeedLogin();
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const deadline = Date.now() + config.schedule.loginWaitMinutes * 60_000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(10_000);
    if (page.isClosed()) return false;
    if (isLoginUrl(page.url())) continue;
    if (await isLoggedIn(page)) return true;
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  }
  return false;
}
