import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { getAIApiKey, callAI, getProviderLabel } from '../utils/ai-provider';
import { logCommandError } from '../utils/error-handler';
import { guildSettings } from '../../settings';
import { aiRateLimiter } from '../utils/ai-rate-limiter';

const MESSAGES_TO_FETCH = 50;
const FETCH_LIMIT = 100;
const MAX_CONTENT_LENGTH = 2000;

export const roastCommand = new SlashCommandBuilder()
  .setName('roast')
  .setDescription('AI рофл-описание пользователя по его сообщениям')
  .addUserOption((option) =>
    option.setName('user').setDescription('Кого роастим').setRequired(true)
  );

export async function handleRoastCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId || '';
  const settings = guildSettings.getSettings(guildId);
  const provider = settings.ai.provider;
  const apiKey = getAIApiKey(provider, guildId);

  if (!apiKey) {
    const label = getProviderLabel(provider);
    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle('⚠️ AI недоступен')
      .setDescription(
        `API ключ ${label} не настроен.\nДобавьте соответствующий ключ в переменные окружения.`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (!settings.ai.roastEnabled) {
    await interaction.reply({
      content: '❌ Команда /roast отключена в настройках.',
      ephemeral: true,
    });
    return;
  }

  const rateCheck = aiRateLimiter.check(guildId, interaction.user.id);
  if (!rateCheck.allowed) {
    await interaction.reply({ content: `⏳ ${rateCheck.reason}`, ephemeral: true });
    return;
  }

  const target = interaction.options.getUser('user', true);
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

  const fetched = await channel.messages.fetch({ limit: FETCH_LIMIT });
  const userMessages = fetched
    .filter((msg) => msg.author.id === target.id && msg.content.length > 0)
    .map((msg) => msg.content)
    .slice(0, MESSAGES_TO_FETCH);

  if (userMessages.length === 0) {
    await interaction.editReply({
      content: `Не нашёл сообщений от **${target.displayName}** в этом канале.`,
    });
    return;
  }

  const messagesText = userMessages.join('\n').slice(0, MAX_CONTENT_LENGTH);

  try {
    const roast = await callAI(
      provider,
      apiKey,
      [
        {
          role: 'system',
          content:
            'Ты — комик в Discord. Напиши смешное, дружелюбное и ироничное описание пользователя на основе его сообщений. Без оскорблений, без токсичности — только добрый юмор. До 800 символов. Отвечай на языке сообщений.',
        },
        {
          role: 'user',
          content: `Вот последние сообщения пользователя "${target.displayName}":\n\n${messagesText}`,
        },
      ],
      { temperature: Math.max(0.5, settings.ai.temperature), model: settings.ai.model || undefined }
    );

    const embed = new EmbedBuilder()
      .setColor(0xff6b6b)
      .setTitle(`🔥 Роаст — ${target.displayName}`)
      .setDescription(roast)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: `Запрос от ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logCommandError('roast', error);

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('❌ Ошибка')
      .setDescription('Не удалось получить роаст. Попробуйте позже.')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}
