import { ensureLoggedIn } from '../browser/auth.js';
import { openSession } from '../browser/session.js';
import { loadConfig } from '../config.js';
import { log } from '../util/log.js';

const config = loadConfig();
const session = await openSession({ ...config, browser: { ...config.browser, headless: false, offscreen: false } });
try {
  const loggedIn = await ensureLoggedIn(session.page, config, async () => {
    log.info('Log in using the browser window. Waiting for the login to complete...');
  });
  log.info(loggedIn ? 'Logged in. Session saved in the browser profile.' : 'Login not completed.');
} finally {
  await session.close();
}
