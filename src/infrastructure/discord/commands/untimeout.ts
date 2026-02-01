import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const untimeoutCommand = new SlashCommandBuilder()
  .setName('untimeout')
  .setDescription('Снять тайм-аут с пользователя')
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
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function handleUntimeoutCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') ?? 'Не указано';

  const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: '❌ Пользователь не найден на сервере.', ephemeral: true });
    return;
  }

  if (!member.isCommunicationDisabled()) {
    await interaction.reply({ content: '❌ У пользователя нет тайм-аута.', ephemeral: true });
    return;
  }

  try {
    await member.timeout(null, reason);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Тайм-аут снят')
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
    console.error('Failed to remove timeout:', error);
    await interaction.reply({ content: '❌ Не удалось снять тайм-аут.', ephemeral: true });
  }
}
