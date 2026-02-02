import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const slowoffCommand = new SlashCommandBuilder()
  .setName('slowoff')
  .setDescription('Быстро выключить медленный режим в канале')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function handleSlowoffCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  if (!(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: '❌ Эта команда работает только в текстовых каналах.', ephemeral: true });
    return;
  }

  if (interaction.channel.rateLimitPerUser === 0) {
    await interaction.reply({ content: '❌ Медленный режим уже выключен.', ephemeral: true });
    return;
  }

  try {
    await interaction.channel.setRateLimitPerUser(0);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🐇 Медленный режим выключен')
      .addFields(
        { name: '📍 Канал', value: `<#${interaction.channel.id}>`, inline: true },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError("slowoff", error);
    await interaction.reply({ content: '❌ Не удалось выключить медленный режим.', ephemeral: true });
  }
}
