import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
  Message,
} from 'discord.js';
import { fetchMessages } from '../utils/fetch-messages';

const PERIOD_CHOICES = [
  { name: '1 час', value: '1h' },
  { name: '6 часов', value: '6h' },
  { name: '12 часов', value: '12h' },
  { name: '1 день', value: '1d' },
  { name: '3 дня', value: '3d' },
] as const;

const PERIOD_MS: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
};

const PERIOD_LABELS: Record<string, string> = {
  '1h': '1 час',
  '6h': '6 часов',
  '12h': '12 часов',
  '1d': '1 день',
  '3d': '3 дня',
};

export const summaryCommand = new SlashCommandBuilder()
  .setName('summary')
  .setDescription('Статистическая выжимка чата за выбранный период')
  .addStringOption((option) =>
    option
      .setName('period')
      .setDescription('Период анализа')
      .setRequired(true)
      .addChoices(...PERIOD_CHOICES)
  );

export async function handleSummaryCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const period = interaction.options.getString('period', true);
  const channel = interaction.channel;

  if (!channel || !(channel instanceof TextChannel)) {
    await interaction.reply({
      content: 'Эта команда работает только в текстовых каналах.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const cutoff = Date.now() - PERIOD_MS[period];
  const messages = await fetchMessages(channel, cutoff);

  if (messages.length === 0) {
    await interaction.editReply({ content: 'За выбранный период сообщений не найдено.' });
    return;
  }

  const stats = analyzeMessages(messages, cutoff);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📊 Выжимка чата за ${PERIOD_LABELS[period]}`)
    .setDescription(`Анализ **${stats.totalMessages}** сообщений в <#${channel.id}>`)
    .addFields(
      {
        name: '👥 Участники',
        value: [
          `**Уникальных:** ${stats.uniqueAuthors}`,
          '',
          '**Топ-5 активных:**',
          ...stats.topAuthors.map(([name, count], i) => `${i + 1}. ${name} — ${count}`),
        ].join('\n'),
        inline: false,
      },
      {
        name: '⏰ Пиковый час',
        value: stats.peakHour,
        inline: true,
      },
      {
        name: '📎 Медиа',
        value: `**Вложений:** ${stats.attachments}\n**Ссылок:** ${stats.links}`,
        inline: true,
      }
    );

  if (stats.mostReacted) {
    embed.addFields({
      name: '🔥 Самое залайканное',
      value: `[${stats.mostReacted.reactions} реакций](${stats.mostReacted.url}) от **${stats.mostReacted.author}**`,
      inline: false,
    });
  }

  embed.setFooter({ text: `Запрос от ${interaction.user.tag}` }).setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

interface SummaryStats {
  totalMessages: number;
  uniqueAuthors: number;
  topAuthors: [string, number][];
  peakHour: string;
  attachments: number;
  links: number;
  mostReacted: { reactions: number; url: string; author: string } | null;
}

function analyzeMessages(messages: Message[], _cutoff: number): SummaryStats {
  const authorCounts = new Map<string, number>();
  const hourCounts = new Map<number, number>();
  let attachments = 0;
  let links = 0;
  let mostReacted: SummaryStats['mostReacted'] = null;

  const urlRegex = /https?:\/\/\S+/gi;

  for (const msg of messages) {
    const authorName = msg.member?.displayName || msg.author.displayName;
    authorCounts.set(authorName, (authorCounts.get(authorName) || 0) + 1);

    const hour = msg.createdAt.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);

    attachments += msg.attachments.size;

    const urlMatches = msg.content.match(urlRegex);
    if (urlMatches) links += urlMatches.length;

    const totalReactions = msg.reactions.cache.reduce((sum, r) => sum + r.count, 0);
    if (totalReactions > 0 && (!mostReacted || totalReactions > mostReacted.reactions)) {
      mostReacted = {
        reactions: totalReactions,
        url: msg.url,
        author: authorName,
      };
    }
  }

  const topAuthors = [...authorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  let peakHourValue = 0;
  let peakHourKey = 0;
  for (const [hour, count] of hourCounts) {
    if (count > peakHourValue) {
      peakHourValue = count;
      peakHourKey = hour;
    }
  }
  const peakHour = `${String(peakHourKey).padStart(2, '0')}:00 — ${String((peakHourKey + 1) % 24).padStart(2, '0')}:00 (${peakHourValue} сообщ.)`;

  return {
    totalMessages: messages.length,
    uniqueAuthors: authorCounts.size,
    topAuthors,
    peakHour,
    attachments,
    links,
    mostReacted,
  };
}
