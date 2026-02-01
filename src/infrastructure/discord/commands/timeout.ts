import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, GuildMember } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

const DURATION_CHOICES = [
  { name: '60 секунд', value: 60 },
  { name: '5 минут', value: 300 },
  { name: '10 минут', value: 600 },
  { name: '1 час', value: 3600 },
  { name: '1 день', value: 86400 },
  { name: '1 неделя', value: 604800 },
];

export const timeoutCommand = new SlashCommandBuilder()
  .setName('timeout')
  .setDescription('Выдать тайм-аут пользователю')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('duration')
      .setDescription('Длительность')
      .setRequired(true)
      .addChoices(...DURATION_CHOICES)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Причина')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function handleTimeoutCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);
  const duration = interaction.options.getInteger('duration', true);
  const reason = interaction.options.getString('reason') ?? 'Не указано';

  if (targetUser.id === interaction.user.id) {
    await interaction.reply({ content: '❌ Нельзя выдать тайм-аут самому себе.', ephemeral: true });
    return;
  }

  if (targetUser.bot) {
    await interaction.reply({ content: '❌ Нельзя выдать тайм-аут боту.', ephemeral: true });
    return;
  }

  const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: '❌ Пользователь не найден на сервере.', ephemeral: true });
    return;
  }

  if (!member.moderatable) {
    await interaction.reply({ content: '❌ Не могу выдать тайм-аут этому пользователю.', ephemeral: true });
    return;
  }

  try {
    await member.timeout(duration * 1000, reason);

    const durationText = DURATION_CHOICES.find(d => d.value === duration)?.name ?? `${duration} сек`;

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle('⏱️ Тайм-аут выдан')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '⏰ Длительность', value: durationText, inline: true },
        { name: '📝 Причина', value: reason },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to timeout user:', error);
    await interaction.reply({ content: '❌ Не удалось выдать тайм-аут.', ephemeral: true });
  }
}
