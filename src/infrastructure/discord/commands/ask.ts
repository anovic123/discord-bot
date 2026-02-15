import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getGroqApiKey, callGroq } from '../utils/groq';
import { logCommandError } from '../utils/error-handler';
import { guildSettings } from '../../settings';
import { aiRateLimiter } from '../utils/ai-rate-limiter';

export const askCommand = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Задать вопрос AI (Groq)')
  .addStringOption((option) =>
    option.setName('question').setDescription('Ваш вопрос').setRequired(true)
  );

export async function handleAskCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle('⚠️ AI недоступен')
      .setDescription('API ключ Groq не настроен.\nДобавьте `GROQ_API_KEY` в переменные окружения.')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const guildId = interaction.guildId || '';
  const settings = guildSettings.getSettings(guildId);

  if (!settings.ai.askEnabled) {
    await interaction.reply({ content: '❌ Команда /ask отключена в настройках.', ephemeral: true });
    return;
  }

  const rateCheck = aiRateLimiter.check(guildId, interaction.user.id);
  if (!rateCheck.allowed) {
    await interaction.reply({ content: `⏳ ${rateCheck.reason}`, ephemeral: true });
    return;
  }

  const question = interaction.options.getString('question', true);

  await interaction.deferReply();
  aiRateLimiter.consume(guildId, interaction.user.id);

  try {
    const answer = await callGroq(
      apiKey,
      [
        {
          role: 'system',
          content:
            'Ты — полезный ассистент в Discord. Отвечай кратко, по делу, до 1500 символов. Отвечай на языке вопроса.',
        },
        {
          role: 'user',
          content: question,
        },
      ],
      { temperature: settings.ai.temperature }
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🤖 AI Ответ')
      .setDescription(answer)
      .setFooter({ text: `Вопрос от ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logCommandError('ask', error);

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('❌ Ошибка')
      .setDescription('Не удалось получить ответ от AI. Попробуйте позже.')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}
