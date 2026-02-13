import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
  Message,
  Collection,
} from 'discord.js';

const STOP_WORDS = new Set([
  'это',
  'что',
  'как',
  'для',
  'все',
  'так',
  'уже',
  'нет',
  'его',
  'она',
  'они',
  'мне',
  'тебе',
  'нас',
  'вас',
  'тут',
  'там',
  'ещё',
  'еще',
  'или',
  'при',
  'без',
  'над',
  'под',
  'был',
  'быть',
  'было',
  'были',
  'буду',
  'будет',
  'будут',
  'когда',
  'если',
  'чтобы',
  'этот',
  'эта',
  'этих',
  'того',
  'тоже',
  'только',
  'потом',
  'после',
  'перед',
  'может',
  'можно',
  'нужно',
  'очень',
  'просто',
  'есть',
  'свой',
  'свои',
  'свою',
  'него',
  'неё',
  'себя',
  'себе',
  'кто',
  'где',
  'чем',
  'чего',
  'ведь',
  'вот',
  'бы',
  'the',
  'and',
  'that',
  'this',
  'with',
  'for',
  'are',
  'but',
  'not',
  'you',
  'all',
  'can',
  'has',
  'her',
  'was',
  'one',
  'our',
  'out',
  'they',
  'been',
  'have',
  'from',
  'will',
  'would',
  'there',
  'their',
  'what',
  'about',
  'which',
  'when',
  'make',
  'like',
  'just',
  'over',
  'such',
  'take',
  'than',
  'them',
  'very',
  'some',
  'could',
  'into',
  'your',
  'then',
  'also',
  'its',
  'only',
  'come',
  'more',
  'these',
  'want',
  'does',
  'це',
  'що',
  'як',
  'для',
  'але',
  'або',
  'так',
  'вже',
  'ні',
  'його',
  'вона',
  'вони',
  'мені',
  'тобі',
  'нас',
  'вас',
  'тут',
  'там',
  'ще',
  'при',
  'без',
  'над',
  'під',
  'був',
  'бути',
  'було',
  'були',
  'буде',
  'будуть',
  'коли',
  'якщо',
  'щоб',
  'цей',
  'ця',
  'цих',
  'того',
  'теж',
  'тільки',
  'потім',
  'після',
  'перед',
  'може',
  'можна',
  'треба',
  'дуже',
  'просто',
  'свій',
  'свої',
  'свою',
  'нього',
  'неї',
  'себе',
  'хто',
]);

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

const MAX_MESSAGES = 500;
const FETCH_LIMIT = 100;

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

  if (stats.topWords.length > 0) {
    embed.addFields({
      name: '💬 Популярные слова',
      value: stats.topWords
        .map(([word, count], i) => `${i + 1}. **${word}** (${count})`)
        .join('\n'),
      inline: false,
    });
  }

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

async function fetchMessages(channel: TextChannel, cutoff: number): Promise<Message[]> {
  const allMessages: Message[] = [];
  let lastId: string | undefined;

  for (let i = 0; i < MAX_MESSAGES / FETCH_LIMIT; i++) {
    const options: { limit: number; before?: string } = { limit: FETCH_LIMIT };
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

interface SummaryStats {
  totalMessages: number;
  uniqueAuthors: number;
  topAuthors: [string, number][];
  peakHour: string;
  topWords: [string, number][];
  attachments: number;
  links: number;
  mostReacted: { reactions: number; url: string; author: string } | null;
}

function analyzeMessages(messages: Message[], _cutoff: number): SummaryStats {
  const authorCounts = new Map<string, number>();
  const hourCounts = new Map<number, number>();
  const wordCounts = new Map<string, number>();
  let attachments = 0;
  let links = 0;
  let mostReacted: SummaryStats['mostReacted'] = null;

  const urlRegex = /https?:\/\/\S+/gi;
  const mentionEmojiRegex = /<[@#!:][^>]+>/g;

  for (const msg of messages) {
    const authorName = msg.member?.displayName || msg.author.displayName;
    authorCounts.set(authorName, (authorCounts.get(authorName) || 0) + 1);

    const hour = msg.createdAt.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);

    attachments += msg.attachments.size;

    const urlMatches = msg.content.match(urlRegex);
    if (urlMatches) links += urlMatches.length;

    const cleanContent = msg.content
      .replace(urlRegex, '')
      .replace(mentionEmojiRegex, '')
      .toLowerCase();

    const words = cleanContent.split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^a-zа-яёіїєґ0-9]/gi, '');
      if (cleaned.length >= 4 && !STOP_WORDS.has(cleaned)) {
        wordCounts.set(cleaned, (wordCounts.get(cleaned) || 0) + 1);
      }
    }

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

  const topWords = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

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
    topWords,
    attachments,
    links,
    mostReacted,
  };
}
