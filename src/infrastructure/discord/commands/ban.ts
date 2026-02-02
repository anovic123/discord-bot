import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const banCommand = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Забанить пользователя на сервере')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Причина')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option
      .setName('delete_messages')
      .setDescription('Удалить сообщения за последние N дней')
      .setRequired(false)
      .addChoices(
        { name: 'Не удалять', value: 0 },
        { name: '1 день', value: 1 },
        { name: '7 дней', value: 7 }
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function handleBanCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') ?? 'Не указано';
  const deleteMessageDays = interaction.options.getInteger('delete_messages') ?? 0;

  if (targetUser.id === interaction.user.id) {
    await interaction.reply({ content: '❌ Нельзя забанить самого себя.', ephemeral: true });
    return;
  }

  const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

  if (member && !member.bannable) {
    await interaction.reply({ content: '❌ Не могу забанить этого пользователя.', ephemeral: true });
    return;
  }

  try {
    await interaction.guild?.members.ban(targetUser, {
      reason,
      deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60,
    });

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('🔨 Пользователь забанен')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '🆔 ID', value: targetUser.id, inline: true },
        { name: '📝 Причина', value: reason },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    if (deleteMessageDays > 0) {
      embed.addFields({ name: '🗑️ Удалено сообщений', value: `За ${deleteMessageDays} дн.`, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError('ban', error);
    await interaction.reply({ content: '❌ Не удалось забанить пользователя.', ephemeral: true });
  }
}
