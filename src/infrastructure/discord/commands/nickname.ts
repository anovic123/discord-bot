import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const nicknameCommand = new SlashCommandBuilder()
  .setName('nickname')
  .setDescription('Сбросить никнейм пользователя')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames);

export async function handleNicknameCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);

  const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: '❌ Пользователь не найден.', ephemeral: true });
    return;
  }

  if (!member.manageable) {
    await interaction.reply({ content: '❌ Не могу изменить никнейм этого пользователя.', ephemeral: true });
    return;
  }

  const oldNickname = member.nickname;

  if (!oldNickname) {
    await interaction.reply({ content: '❌ У пользователя нет никнейма.', ephemeral: true });
    return;
  }

  try {
    await member.setNickname(null);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📝 Никнейм сброшен')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '📛 Старый никнейм', value: oldNickname, inline: true },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to reset nickname:', error);
    await interaction.reply({ content: '❌ Не удалось сбросить никнейм.', ephemeral: true });
  }
}
