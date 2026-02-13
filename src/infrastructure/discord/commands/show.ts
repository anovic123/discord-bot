import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
  EmbedBuilder,
} from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const showCommand = new SlashCommandBuilder()
  .setName('show')
  .setDescription('Показать скрытый канал всем участникам')
  .addStringOption((option) =>
    option.setName('reason').setDescription('Причина').setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function handleShowCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  if (!(interaction.channel instanceof TextChannel)) {
    await interaction.reply({
      content: '❌ Эта команда работает только в текстовых каналах.',
      ephemeral: true,
    });
    return;
  }

  const reason = interaction.options.getString('reason') ?? 'Не указано';

  try {
    await interaction.channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
      ViewChannel: null,
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('👁️ Канал виден')
      .addFields(
        { name: '📍 Канал', value: `<#${interaction.channel.id}>`, inline: true },
        { name: '📝 Причина', value: reason },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError('show', error);
    await interaction.reply({ content: '❌ Не удалось показать канал.', ephemeral: true });
  }
}
