import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const undeafenCommand = new SlashCommandBuilder()
  .setName('undeafen')
  .setDescription('Снять заглушку с пользователя')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers);

export async function handleUndeafenCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);

  const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: '❌ Пользователь не найден.', ephemeral: true });
    return;
  }

  if (!member.voice.channel) {
    await interaction.reply({ content: '❌ Пользователь не в голосовом канале.', ephemeral: true });
    return;
  }

  if (!member.voice.deaf) {
    await interaction.reply({ content: '❌ Пользователь не заглушен.', ephemeral: true });
    return;
  }

  try {
    await member.voice.setDeaf(false);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🔊 Заглушка снята')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '🔊 Канал', value: member.voice.channel.name, inline: true },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to undeafen user:', error);
    await interaction.reply({ content: '❌ Не удалось снять заглушку.', ephemeral: true });
  }
}
