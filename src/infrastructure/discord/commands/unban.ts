import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const unbanCommand = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('Разбанить пользователя')
  .addStringOption(option =>
    option
      .setName('user_id')
      .setDescription('ID пользователя для разбана')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Причина разбана')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function handleUnbanCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const userId = interaction.options.getString('user_id', true);
  const reason = interaction.options.getString('reason') ?? 'Не указано';

  try {
    const banList = await interaction.guild?.bans.fetch();
    const bannedUser = banList?.get(userId);

    if (!bannedUser) {
      await interaction.reply({ content: '❌ Пользователь не найден в списке банов.', ephemeral: true });
      return;
    }

    await interaction.guild?.members.unban(userId, reason);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Пользователь разбанен')
      .addFields(
        { name: '👤 Пользователь', value: bannedUser.user.tag, inline: true },
        { name: '🆔 ID', value: userId, inline: true },
        { name: '📝 Причина', value: reason },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(bannedUser.user.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to unban user:', error);
    await interaction.reply({ content: '❌ Не удалось разбанить пользователя.', ephemeral: true });
  }
}
