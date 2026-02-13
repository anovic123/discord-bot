import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';
import { createLogger } from '../../logger';

const logger = createLogger('TempBan');

const DURATION_CHOICES = [
  { name: '30 минут', value: 30 },
  { name: '1 час', value: 60 },
  { name: '6 часов', value: 360 },
  { name: '12 часов', value: 720 },
  { name: '1 день', value: 1440 },
  { name: '3 дня', value: 4320 },
  { name: '7 дней', value: 10080 },
] as const;

const activeTempBans: Map<string, NodeJS.Timeout> = new Map();

export const tempbanCommand = new SlashCommandBuilder()
  .setName('tempban')
  .setDescription('Временно забанить пользователя')
  .addUserOption((option) =>
    option.setName('user').setDescription('Пользователь').setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('duration')
      .setDescription('Длительность бана')
      .setRequired(true)
      .addChoices(...DURATION_CHOICES)
  )
  .addStringOption((option) =>
    option.setName('reason').setDescription('Причина').setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    return `${h} ч`;
  }
  const d = Math.floor(minutes / 1440);
  return `${d} дн.`;
}

export async function handleTempbanCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);
  const durationMinutes = interaction.options.getInteger('duration', true);
  const reason = interaction.options.getString('reason') ?? 'Не указано';
  const guild = interaction.guild;

  if (!guild) return;

  if (targetUser.id === interaction.user.id) {
    await interaction.reply({ content: '❌ Нельзя забанить самого себя.', ephemeral: true });
    return;
  }

  const member = await guild.members.fetch(targetUser.id).catch(() => null);

  if (member && !member.bannable) {
    await interaction.reply({
      content: '❌ Не могу забанить этого пользователя.',
      ephemeral: true,
    });
    return;
  }

  try {
    const tempBanReason = `[Tempban: ${formatDuration(durationMinutes)}] ${reason}`;
    await guild.members.ban(targetUser, { reason: tempBanReason });

    const key = `${guild.id}:${targetUser.id}`;

    const existingTimer = activeTempBans.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(
      async () => {
        try {
          await guild.members.unban(targetUser.id, 'Tempban истёк');
          logger.info(`Tempban expired: ${targetUser.tag} (${targetUser.id})`);
        } catch (e) {
          logger.warn(
            `Failed to auto-unban ${targetUser.tag}: ${e instanceof Error ? e.message : String(e)}`
          );
        }
        activeTempBans.delete(key);
      },
      durationMinutes * 60 * 1000
    );

    activeTempBans.set(key, timer);

    const unbanTimestamp = Math.floor(Date.now() / 1000) + durationMinutes * 60;

    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle('⏱️ Временный бан')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '🆔 ID', value: targetUser.id, inline: true },
        { name: '⏳ Длительность', value: formatDuration(durationMinutes), inline: true },
        { name: '🔓 Разбан', value: `<t:${unbanTimestamp}:R>`, inline: true },
        { name: '📝 Причина', value: reason },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError('tempban', error);
    await interaction.reply({
      content: '❌ Не удалось забанить пользователя.',
      ephemeral: true,
    });
  }
}
