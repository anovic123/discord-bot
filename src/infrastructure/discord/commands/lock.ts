import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
  EmbedBuilder,
} from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const lockCommand = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('Заблокировать канал (запретить отправку сообщений)')
  .addStringOption((option) =>
    option.setName('reason').setDescription('Причина блокировки').setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function handleLockCommand(interaction: ChatInputCommandInteraction): Promise<void> {
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
      SendMessages: false,
    });

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🔒 Канал заблокирован')
      .addFields(
        { name: '📍 Канал', value: `<#${interaction.channel.id}>`, inline: true },
        { name: '📝 Причина', value: reason },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError('lock', error);
    await interaction.reply({ content: '❌ Не удалось заблокировать канал.', ephemeral: true });
  }
}
