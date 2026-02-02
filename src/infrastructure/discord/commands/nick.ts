import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const nickCommand = new SlashCommandBuilder()
  .setName('nick')
  .setDescription('Изменить никнейм пользователя')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('nickname')
      .setDescription('Новый никнейм (оставьте пустым для сброса)')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames);

export async function handleNickCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);
  const newNickname = interaction.options.getString('nickname');

  const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: '❌ Пользователь не найден на сервере.', ephemeral: true });
    return;
  }

  if (!member.manageable) {
    await interaction.reply({ content: '❌ Не могу изменить никнейм этого пользователя.', ephemeral: true });
    return;
  }

  const oldNickname = member.nickname ?? member.user.username;

  try {
    await member.setNickname(newNickname);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📝 Никнейм изменён')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '🆔 ID', value: targetUser.id, inline: true },
        { name: '📛 Старый никнейм', value: oldNickname, inline: true },
        { name: '📛 Новый никнейм', value: newNickname ?? '*Сброшен*', inline: true },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError("nick", error);
    await interaction.reply({ content: '❌ Не удалось изменить никнейм.', ephemeral: true });
  }
}
