import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const voiceunmuteCommand = new SlashCommandBuilder()
  .setName('voiceunmute')
  .setDescription('Размутить пользователя в голосовом канале')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers);

export async function handleVoiceunmuteCommand(
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

  if (!member.voice.mute) {
    await interaction.reply({ content: '❌ Пользователь не замучен.', ephemeral: true });
    return;
  }

  try {
    await member.voice.setMute(false);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🔊 Пользователь размучен')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '🔊 Канал', value: member.voice.channel.name, inline: true },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to unmute user:', error);
    await interaction.reply({ content: '❌ Не удалось размутить пользователя.', ephemeral: true });
  }
}
