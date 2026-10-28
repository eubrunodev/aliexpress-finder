import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envFile = resolve(process.cwd(), '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

export const env = {
  discordWebhookUrl: (process.env.DISCORD_WEBHOOK_URL ?? '').trim(),
};
