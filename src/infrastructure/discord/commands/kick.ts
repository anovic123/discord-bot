import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const kickCommand = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Кикнуть пользователя с сервера')
  .addUserOption((option) =>
    option.setName('user').setDescription('Пользователь').setRequired(true)
  )
  .addStringOption((option) =>
    option.setName('reason').setDescription('Причина').setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function handleKickCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') ?? 'Не указано';

  if (targetUser.id === interaction.user.id) {
    await interaction.reply({ content: '❌ Нельзя кикнуть самого себя.', ephemeral: true });
    return;
  }

  const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: '❌ Пользователь не найден на сервере.', ephemeral: true });
    return;
  }

  if (!member.kickable) {
    await interaction.reply({ content: '❌ Не могу кикнуть этого пользователя.', ephemeral: true });
    return;
  }

  try {
    await member.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('👢 Пользователь кикнут')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '🆔 ID', value: targetUser.id, inline: true },
        { name: '📝 Причина', value: reason },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError('kick', error);
    await interaction.reply({ content: '❌ Не удалось кикнуть пользователя.', ephemeral: true });
  }
}
