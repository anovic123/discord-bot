import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { createLogger } from '../../logger';
import { guildSettings } from '../../settings';
import { getGroqApiKey, callGroq } from './groq';

const logger = createLogger('ToxicMode');

const TOXIC_PROMPT =
  'Ты — злой, но смешной комик в Discord чате. Напиши короткую токсичную, саркастичную шутку о пользователе на основе его сообщений. Стиль: панч-лайны, ирония, сарказм. Максимум 500 символов. Пиши на языке сообщений пользователя.';

interface DailyCounter {
  date: string;
  count: number;
}

class ToxicModeManager {
  private client: Client | null = null;
  private timers = new Map<string, NodeJS.Timeout>();
  private dailyCounters = new Map<string, DailyCounter>();

  init(client: Client): void {
    this.client = client;
  }

  async restoreTimers(): Promise<void> {
    const guildIds = guildSettings.getAllGuildIds();

    for (const guildId of guildIds) {
      const settings = guildSettings.getSettings(guildId);
      if (settings.toxicMode.enabled && settings.toxicMode.channelId) {
        this.startTimer(guildId);
      }
    }

    logger.info(`Restored toxic mode timers for ${this.timers.size} guild(s)`);
  }

  startTimer(guildId: string): void {
    this.stopTimer(guildId);

    const settings = guildSettings.getSettings(guildId);
    const intervalMs = settings.toxicMode.frequencyMinutes * 60 * 1000;

    const timer = setInterval(() => {
      this.tick(guildId).catch((err) =>
        logger.error(`Toxic mode tick error [${guildId}]`, err)
      );
    }, intervalMs);

    this.timers.set(guildId, timer);
    logger.info(`Toxic mode timer started for guild ${guildId} (every ${settings.toxicMode.frequencyMinutes}min)`);
  }

  stopTimer(guildId: string): void {
    const existing = this.timers.get(guildId);
    if (existing) {
      clearInterval(existing);
      this.timers.delete(guildId);
      logger.info(`Toxic mode timer stopped for guild ${guildId}`);
    }
  }

  restartTimer(guildId: string): void {
    this.startTimer(guildId);
  }

  getDailyCount(guildId: string): number {
    const counter = this.dailyCounters.get(guildId);
    const today = new Date().toISOString().slice(0, 10);

    if (!counter || counter.date !== today) return 0;
    return counter.count;
  }

  private incrementCounter(guildId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    const counter = this.dailyCounters.get(guildId);

    if (!counter || counter.date !== today) {
      this.dailyCounters.set(guildId, { date: today, count: 1 });
      return 1;
    }

    counter.count++;
    return counter.count;
  }

  private async tick(guildId: string): Promise<void> {
    const apiKey = getGroqApiKey();
    if (!apiKey) return;

    const settings = guildSettings.getSettings(guildId);

    if (!settings.toxicMode.enabled) {
      this.stopTimer(guildId);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const counter = this.dailyCounters.get(guildId);
    const currentCount = counter && counter.date === today ? counter.count : 0;

    if (currentCount >= settings.toxicMode.maxPerDay) return;

    if (!this.client) return;

    const channel = await this.client.channels
      .fetch(settings.toxicMode.channelId)
      .catch(() => null);

    if (!channel || !(channel instanceof TextChannel)) return;

    const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (!messages || messages.size === 0) return;

    const nonBotMessages = messages.filter((m) => !m.author.bot);
    if (nonBotMessages.size === 0) return;

    const authors = [...new Map(nonBotMessages.map((m) => [m.author.id, m.author])).values()];
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];

    const userMessages = nonBotMessages
      .filter((m) => m.author.id === randomAuthor.id)
      .map((m) => m.content)
      .filter((c) => c.length > 0);

    if (userMessages.length === 0) return;

    let combined = '';
    for (const msg of userMessages) {
      if (combined.length + msg.length > 2000) break;
      combined += msg + '\n';
    }

    const aiResponse = await callGroq(apiKey, [
      { role: 'system', content: TOXIC_PROMPT },
      { role: 'user', content: `Пользователь: ${randomAuthor.displayName}\n\nЕго сообщения:\n${combined.trim()}` },
    ], { temperature: 0.9 });

    const count = this.incrementCounter(guildId);
    const remaining = settings.toxicMode.maxPerDay - count;

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('☢️ Toxic Mode')
      .setDescription(aiResponse)
      .setThumbnail(randomAuthor.displayAvatarURL({ size: 256 }))
      .setFooter({ text: `Осталось: ${remaining}/${settings.toxicMode.maxPerDay}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    logger.info(`Toxic message sent in guild ${guildId}, target: ${randomAuthor.tag}`);
  }
}

export const toxicModeManager = new ToxicModeManager();
