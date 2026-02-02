import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

const DURATION_CHOICES = [
  { name: 'Выключить', value: 0 },
  { name: '5 секунд', value: 5 },
  { name: '10 секунд', value: 10 },
  { name: '15 секунд', value: 15 },
  { name: '30 секунд', value: 30 },
  { name: '1 минута', value: 60 },
  { name: '2 минуты', value: 120 },
  { name: '5 минут', value: 300 },
  { name: '10 минут', value: 600 },
  { name: '15 минут', value: 900 },
  { name: '30 минут', value: 1800 },
  { name: '1 час', value: 3600 },
  { name: '2 часа', value: 7200 },
  { name: '6 часов', value: 21600 },
];

export const slowmodeCommand = new SlashCommandBuilder()
  .setName('slowmode')
  .setDescription('Установить медленный режим в канале')
  .addIntegerOption(option =>
    option
      .setName('duration')
      .setDescription('Задержка между сообщениями')
      .setRequired(true)
      .addChoices(...DURATION_CHOICES)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function handleSlowmodeCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  if (!(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: '❌ Эта команда работает только в текстовых каналах.', ephemeral: true });
    return;
  }

  const duration = interaction.options.getInteger('duration', true);

  try {
    await interaction.channel.setRateLimitPerUser(duration);

    const durationText = DURATION_CHOICES.find(d => d.value === duration)?.name ?? `${duration} сек`;

    const embed = new EmbedBuilder()
      .setColor(duration === 0 ? 0x00ff00 : 0xFFA500)
      .setTitle(duration === 0 ? '🐇 Медленный режим выключен' : '🐢 Медленный режим включен')
      .addFields(
        { name: '📍 Канал', value: `<#${interaction.channel.id}>`, inline: true },
        { name: '⏱️ Задержка', value: durationText, inline: true },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError("slowmode", error);
    await interaction.reply({ content: '❌ Не удалось установить медленный режим.', ephemeral: true });
  }
}
