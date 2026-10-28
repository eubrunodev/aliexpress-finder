import { chunk, sleep } from '../util/random.js';

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface Embed {
  title?: string;
  url?: string;
  description?: string;
  color?: number;
  thumbnail?: { url: string };
  fields?: EmbedField[];
  footer?: { text: string };
  timestamp?: string;
}

export async function sendEmbeds(webhookUrl: string, embeds: Embed[], content?: string): Promise<void> {
  for (const batch of chunk(embeds, 10)) {
    await post(webhookUrl, { content, embeds: batch, allowed_mentions: { parse: [] } });
  }
}

export async function sendMessage(webhookUrl: string, content: string): Promise<void> {
  await post(webhookUrl, { content, allowed_mentions: { parse: [] } });
}

async function post(webhookUrl: string, body: Record<string, unknown>, attempt = 0): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status === 429 && attempt < 5) {
    const data = (await response.json().catch(() => ({}))) as { retry_after?: number };
    await sleep((data.retry_after ?? 1) * 1000 + 250);
    return post(webhookUrl, body, attempt + 1);
  }
  if (!response.ok) {
    throw new Error(`Discord webhook failed with ${response.status}: ${await response.text()}`);
  }
  await sleep(600);
}
