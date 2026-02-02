import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { logCommandError } from '../utils/error-handler';

export const reminderCommand = new SlashCommandBuilder()
  .setName('reminder')
  .setDescription('Установить напоминание')
  .addStringOption(option =>
    option.setName('text')
      .setDescription('Текст напоминания')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('minutes')
      .setDescription('Через сколько минут напомнить')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(1440));

export async function handleReminderCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const text = interaction.options.getString('text', true);
  const minutes = interaction.options.getInteger('minutes', true);

  const reminderTime = new Date(Date.now() + minutes * 60 * 1000);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('⏰ Напоминание установлено')
    .addFields(
      { name: '📝 Текст', value: text },
      { name: '⏱️ Через', value: `${minutes} мин.` },
      { name: '🕐 Время', value: `<t:${Math.floor(reminderTime.getTime() / 1000)}:R>` }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  setTimeout(async () => {
    const reminderEmbed = new EmbedBuilder()
      .setColor(0xFF9900)
      .setTitle('🔔 Напоминание!')
      .setDescription(text)
      .addFields({ name: '👤 Для', value: `${interaction.user}` })
      .setTimestamp();

    try {
      await interaction.followUp({ content: `${interaction.user}`, embeds: [reminderEmbed] });
    } catch (error) {
      logCommandError("reminder", error);
    }
  }, minutes * 60 * 1000);
}
