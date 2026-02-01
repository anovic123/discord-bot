import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const unlockCommand = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('Разблокировать канал (разрешить отправку сообщений)')
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Причина разблокировки')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function handleUnlockCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  if (!(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: '❌ Эта команда работает только в текстовых каналах.', ephemeral: true });
    return;
  }

  const reason = interaction.options.getString('reason') ?? 'Не указано';

  try {
    await interaction.channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
      SendMessages: null,
    });

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🔓 Канал разблокирован')
      .addFields(
        { name: '📍 Канал', value: `<#${interaction.channel.id}>`, inline: true },
        { name: '📝 Причина', value: reason },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to unlock channel:', error);
    await interaction.reply({ content: '❌ Не удалось разблокировать канал.', ephemeral: true });
  }
}
