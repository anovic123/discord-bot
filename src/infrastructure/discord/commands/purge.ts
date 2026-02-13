import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
  EmbedBuilder,
} from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const purgeCommand = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Удалить сообщения пользователя в канале')
  .addUserOption((option) =>
    option.setName('user').setDescription('Пользователь').setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('amount')
      .setDescription('Количество сообщений для проверки (макс. 100)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function handlePurgeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  if (!(interaction.channel instanceof TextChannel)) {
    await interaction.reply({
      content: '❌ Эта команда работает только в текстовых каналах.',
      ephemeral: true,
    });
    return;
  }

  const targetUser = interaction.options.getUser('user', true);
  const amount = interaction.options.getInteger('amount') ?? 100;

  await interaction.deferReply({ ephemeral: true });

  try {
    const messages = await interaction.channel.messages.fetch({ limit: amount });
    const userMessages = messages.filter((m) => m.author.id === targetUser.id);

    if (userMessages.size === 0) {
      await interaction.editReply({
        content: `❌ Не найдено сообщений от ${targetUser.tag} среди последних ${amount} сообщений.`,
      });
      return;
    }

    const deleted = await interaction.channel.bulkDelete(userMessages, true);

    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle('🗑️ Сообщения удалены')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '🗑️ Удалено', value: `${deleted.size} сообщений`, inline: true },
        { name: '📍 Канал', value: `<#${interaction.channel.id}>`, inline: true },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logCommandError('purge', error);
    await interaction.editReply({
      content: '❌ Не удалось удалить сообщения. Возможно, они старше 14 дней.',
    });
  }
}
