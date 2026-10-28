import { loadConfig } from '../config.js';
import { runOnce } from '../pipeline/run.js';
import { log } from '../util/log.js';
import { sleep } from '../util/random.js';

log.info('AliExpress Finder started');
while (true) {
  let intervalMinutes = 90;
  try {
    const config = loadConfig();
    intervalMinutes = config.schedule.intervalMinutes + Math.random() * config.schedule.jitterMinutes;
    await runOnce(config);
  } catch (error) {
    log.error(`Run failed: ${(error as Error).stack ?? error}`);
  }
  const nextRun = new Date(Date.now() + intervalMinutes * 60_000);
  log.info(`Next run at ${nextRun.toLocaleTimeString('pt-BR')}`);
  await sleep(intervalMinutes * 60_000);
}
