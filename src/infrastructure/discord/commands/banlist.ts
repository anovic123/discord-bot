import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const banlistCommand = new SlashCommandBuilder()
  .setName('banlist')
  .setDescription('Показать список забаненных пользователей')
  .addIntegerOption(option =>
    option
      .setName('page')
      .setDescription('Страница (по 10 записей)')
      .setRequired(false)
      .setMinValue(1)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function handleBanlistCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const page = interaction.options.getInteger('page') ?? 1;
  const perPage = 10;

  try {
    const bans = await interaction.guild?.bans.fetch();

    if (!bans || bans.size === 0) {
      await interaction.reply({ content: '✅ Список банов пуст.', ephemeral: true });
      return;
    }

    const bansArray = Array.from(bans.values());
    const totalPages = Math.ceil(bansArray.length / perPage);
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageBans = bansArray.slice(start, end);

    const bansList = pageBans.map((ban, index) => {
      const reason = ban.reason ?? 'Не указано';
      return `**${start + index + 1}.** ${ban.user.tag} (\`${ban.user.id}\`)\n└ Причина: ${reason}`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('🔨 Список забаненных')
      .setDescription(bansList)
      .setFooter({ text: `Страница ${currentPage}/${totalPages} • Всего: ${bansArray.length}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Failed to fetch ban list:', error);
    await interaction.reply({ content: '❌ Не удалось получить список банов.', ephemeral: true });
  }
}
