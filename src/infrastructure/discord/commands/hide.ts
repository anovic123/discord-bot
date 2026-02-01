import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const hideCommand = new SlashCommandBuilder()
  .setName('hide')
  .setDescription('Скрыть канал от всех участников')
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Причина')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function handleHideCommand(
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
      ViewChannel: false,
    });

    const embed = new EmbedBuilder()
      .setColor(0x808080)
      .setTitle('👁️‍🗨️ Канал скрыт')
      .addFields(
        { name: '📍 Канал', value: `<#${interaction.channel.id}>`, inline: true },
        { name: '📝 Причина', value: reason },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to hide channel:', error);
    await interaction.reply({ content: '❌ Не удалось скрыть канал.', ephemeral: true });
  }
}
