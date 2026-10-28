import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, type BrowserContext, type Page } from 'playwright';
import type { Config } from '../config.js';
import { log } from '../util/log.js';

type LaunchOptions = NonNullable<Parameters<typeof chromium.launchPersistentContext>[1]>;

export interface Session {
  context: BrowserContext;
  page: Page;
  close(): Promise<void>;
}

const LOCALE_COOKIE = 'aep_usuc_f';
const LOCALE_VALUES: Record<string, string> = {
  site: 'bra',
  c_tp: 'BRL',
  region: 'BR',
  b_locale: 'pt_BR',
};

export async function openSession(config: Config): Promise<Session> {
  const profileDir = resolve(process.cwd(), config.browser.profileDir);
  mkdirSync(profileDir, { recursive: true });
  const args = ['--disable-blink-features=AutomationControlled', '--window-size=1400,1000'];
  if (config.browser.offscreen) args.push('--window-position=-32000,-32000');
  const base: LaunchOptions = {
    headless: config.browser.headless,
    viewport: null,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    ignoreDefaultArgs: ['--enable-automation'],
    args,
  };
  const context = await launch(profileDir, base, config.browser.channel);
  await applyLocaleCookie(context);
  const page = context.pages()[0] ?? (await context.newPage());
  page.setDefaultTimeout(45_000);
  return { context, page, close: () => context.close() };
}

async function launch(profileDir: string, base: LaunchOptions, channel: string): Promise<BrowserContext> {
  const channels = channel === 'chromium' ? [] : [...new Set([channel, 'msedge'])];
  for (const candidate of channels) {
    try {
      return await chromium.launchPersistentContext(profileDir, { ...base, channel: candidate });
    } catch (error) {
      log.warn(`Browser channel "${candidate}" unavailable: ${(error as Error).message.split('\n')[0]}`);
    }
  }
  return chromium.launchPersistentContext(profileDir, base);
}

async function applyLocaleCookie(context: BrowserContext): Promise<void> {
  const cookies = await context.cookies('https://www.aliexpress.com');
  const current = cookies.find((cookie) => cookie.name === LOCALE_COOKIE)?.value ?? '';
  const entries = new Map<string, string>();
  for (const pair of current.split('&').filter(Boolean)) {
    const separator = pair.indexOf('=');
    if (separator === -1) continue;
    entries.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
  for (const [key, value] of Object.entries(LOCALE_VALUES)) entries.set(key, value);
  const next = [...entries].map(([key, value]) => `${key}=${value}`).join('&');
  if (next === current) return;
  await context.addCookies([
    {
      name: LOCALE_COOKIE,
      value: next,
      domain: '.aliexpress.com',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
    },
  ]);
}
