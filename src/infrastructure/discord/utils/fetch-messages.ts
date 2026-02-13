import { TextChannel, Message, Collection } from 'discord.js';

export const MAX_MESSAGES = 500;
export const FETCH_LIMIT = 100;

interface FetchOptions {
  limit: number;
  before?: string;
}

export async function fetchMessages(channel: TextChannel, cutoff: number): Promise<Message[]> {
  const allMessages: Message[] = [];
  let lastId: string | undefined;

  for (let i = 0; i < MAX_MESSAGES / FETCH_LIMIT; i++) {
    const options: FetchOptions = { limit: FETCH_LIMIT };
    if (lastId) options.before = lastId;

    const fetched: Collection<string, Message> = await channel.messages.fetch(options);
    if (fetched.size === 0) break;

    for (const msg of fetched.values()) {
      if (msg.createdTimestamp < cutoff) return allMessages;
      if (!msg.author.bot) allMessages.push(msg);
    }

    lastId = fetched.last()?.id;
    if (fetched.size < FETCH_LIMIT) break;
  }

  return allMessages;
}
