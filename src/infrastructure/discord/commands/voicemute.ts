import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const voicemuteCommand = new SlashCommandBuilder()
  .setName('voicemute')
  .setDescription('Замутить пользователя в голосовом канале')
  .addUserOption((option) =>
    option.setName('user').setDescription('Пользователь').setRequired(true)
  )
  .addStringOption((option) =>
    option.setName('reason').setDescription('Причина').setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers);

export async function handleVoicemuteCommand(
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

  if (member.voice.mute) {
    await interaction.reply({ content: '❌ Пользователь уже замучен.', ephemeral: true });
    return;
  }

  try {
    await member.voice.setMute(true, reason);

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🔇 Пользователь замучен')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '🔊 Канал', value: member.voice.channel.name, inline: true },
        { name: '📝 Причина', value: reason },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError('voicemute', error);
    await interaction.reply({ content: '❌ Не удалось замутить пользователя.', ephemeral: true });
  }
}
