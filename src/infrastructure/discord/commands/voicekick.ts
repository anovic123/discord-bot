import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const voicekickCommand = new SlashCommandBuilder()
  .setName('voicekick')
  .setDescription('Отключить пользователя от голосового канала')
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
  .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers);

export async function handleVoicekickCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason') ?? 'Не указано';

  const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: '❌ Пользователь не найден.', ephemeral: true });
    return;
  }

  if (!member.voice.channel) {
    await interaction.reply({ content: '❌ Пользователь не в голосовом канале.', ephemeral: true });
    return;
  }

  const channelName = member.voice.channel.name;

  try {
    await member.voice.disconnect(reason);

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle('🔇 Отключён от голосового канала')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '🔊 Канал', value: channelName, inline: true },
        { name: '📝 Причина', value: reason },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError("voicekick", error);
    await interaction.reply({ content: '❌ Не удалось отключить пользователя.', ephemeral: true });
  }
}
