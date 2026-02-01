import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

const startTime = Date.now();

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts = [];
  if (days > 0) parts.push(`${days} дн.`);
  if (hours % 24 > 0) parts.push(`${hours % 24} год.`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60} хв.`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60} сек.`);

  return parts.join(' ') || '0 сек.';
}

export const uptimeCommand = new SlashCommandBuilder()
  .setName('uptime')
  .setDescription('Показать время работы бота');

export async function handleUptimeCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const uptime = Date.now() - startTime;

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('⏱️ Время работы бота')
    .addFields(
      { name: '🕐 Аптайм', value: formatUptime(uptime), inline: true },
      { name: '📅 Запущен', value: `<t:${Math.floor(startTime / 1000)}:F>`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
