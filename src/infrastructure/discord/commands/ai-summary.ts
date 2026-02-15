import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { fetchMessages } from '../utils/fetch-messages';
import { getAIApiKey, callAI, getProviderLabel } from '../utils/ai-provider';
import { logCommandError } from '../utils/error-handler';
import { createLogger } from '../../logger';
import { guildSettings } from '../../settings';
import { aiRateLimiter } from '../utils/ai-rate-limiter';

const logger = createLogger('AiSummary');

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

const MAX_CONTENT_LENGTH = 4000;

export const aiSummaryCommand = new SlashCommandBuilder()
  .setName('ai-summary')
  .setDescription('AI выжимка чата за выбранный период (Groq)')
  .addStringOption((option) =>
    option
      .setName('period')
      .setDescription('Период анализа')
      .setRequired(true)
      .addChoices(...PERIOD_CHOICES)
  );

export async function handleAiSummaryCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guildId = interaction.guildId || '';
  const aiSettings = guildSettings.getSettings(guildId);
  const provider = aiSettings.ai.provider;
  const apiKey = getAIApiKey(provider, guildId);

  if (!apiKey) {
    const label = getProviderLabel(provider);
    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle('⚠️ AI-выжимка недоступна')
      .setDescription(`API ключ ${label} не настроен.\nДобавьте соответствующий ключ в переменные окружения.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (!aiSettings.ai.aiSummaryEnabled) {
    await interaction.reply({
      content: '❌ Команда /ai-summary отключена в настройках.',
      ephemeral: true,
    });
    return;
  }

  const rateCheck = aiRateLimiter.check(guildId, interaction.user.id);
  if (!rateCheck.allowed) {
    await interaction.reply({ content: `⏳ ${rateCheck.reason}`, ephemeral: true });
    return;
  }

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
  aiRateLimiter.consume(guildId, interaction.user.id);

  const cutoff = Date.now() - PERIOD_MS[period];
  const messages = await fetchMessages(channel, cutoff);

  if (messages.length === 0) {
    await interaction.editReply({ content: 'За выбранный период сообщений не найдено.' });
    return;
  }

  let chatText = messages
    .reverse()
    .map((msg) => {
      const author = msg.member?.displayName || msg.author.displayName;
      return `${author}: ${msg.content}`;
    })
    .join('\n');

  if (chatText.length > MAX_CONTENT_LENGTH) {
    chatText = chatText.slice(0, MAX_CONTENT_LENGTH);
  }

  try {
    logger.debug('AI API request', { provider, messagesCount: messages.length, period });

    const summary = await callAI(
      provider,
      apiKey,
      [
        {
          role: 'system',
          content:
            'Ты — помощник, который делает краткую выжимку чата. Отвечай на языке чата. Выжимка должна быть до 1500 символов. Выдели основные темы, ключевые решения и важные моменты.',
        },
        {
          role: 'user',
          content: `Сделай краткую выжимку этого чата:\n\n${chatText}`,
        },
      ],
      { model: aiSettings.ai.model || undefined }
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🤖 AI-выжимка за ${PERIOD_LABELS[period]}`)
      .setDescription(summary)
      .setFooter({
        text: `${messages.length} сообщений проанализировано • Запрос от ${interaction.user.tag}`,
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logCommandError('ai-summary', error);

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('❌ Ошибка')
      .setDescription('Не удалось получить AI-выжимку. Попробуйте позже.')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}
