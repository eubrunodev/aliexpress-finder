import type { Page } from 'playwright';
import { pause, randomBetween, type Range } from '../util/random.js';

export async function autoScroll(page: Page, times: number, pauseRange: Range): Promise<void> {
  for (let index = 0; index < times; index += 1) {
    await page.mouse.wheel(0, randomBetween([600, 1200]));
    await pause(pauseRange);
  }
}
