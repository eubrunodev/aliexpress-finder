import { loadConfig } from '../config.js';
import { runOnce } from '../pipeline/run.js';
import { log } from '../util/log.js';

try {
  await runOnce(loadConfig());
  log.info('Run finished');
} catch (error) {
  log.error(`Run failed: ${(error as Error).stack ?? error}`);
  process.exitCode = 1;
}
