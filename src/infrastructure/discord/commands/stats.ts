import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, version as djsVersion } from 'discord.js';
import { statsTracker } from '../utils/stats-tracker';
import os from 'os';

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts = [];
  if (days > 0) parts.push(`${days}д`);
  if (hours % 24 > 0) parts.push(`${hours % 24}г`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}хв`);
  if (seconds % 60 > 0 || parts.length === 0) parts.push(`${seconds % 60}с`);

  return parts.join(' ');
}

export const statsCommand = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Показать статистику бота');

export async function handleStatsCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const client = interaction.client;
  const stats = statsTracker.getStats();

  const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
  const totalChannels = client.channels.cache.size;
  const totalGuilds = client.guilds.cache.size;

  const memoryUsage = process.memoryUsage();
  const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
  const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2);

  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);

  const topCommandsStr = stats.topCommands.length > 0
    ? stats.topCommands.map(([cmd, count], i) => `${i + 1}. \`/${cmd}\` — ${count}`).join('\n')
    : 'Нет данных';

  const lastCommandStr = stats.lastCommandTime
    ? `<t:${Math.floor(stats.lastCommandTime.getTime() / 1000)}:R>`
    : 'Нет данных';

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📊 Статистика бота')
    .setThumbnail(client.user?.displayAvatarURL() || null)
    .addFields(
      { name: '🏠 Серверов', value: `${totalGuilds}`, inline: true },
      { name: '👥 Пользователей', value: `${totalMembers}`, inline: true },
      { name: '📺 Каналов', value: `${totalChannels}`, inline: true },
      { name: '⚡ Команд выполнено', value: `${stats.commandsExecuted}`, inline: true },
      { name: '🔧 Уникальных команд', value: `${stats.uniqueCommands}`, inline: true },
      { name: '❌ Ошибок', value: `${stats.errorsCount}`, inline: true },
      { name: '🏓 Пинг', value: `${client.ws.ping}ms`, inline: true },
      { name: '⏱️ Аптайм', value: formatUptime(statsTracker.getUptime()), inline: true },
      { name: '🕐 Последняя команда', value: lastCommandStr, inline: true },
      { name: '💾 Память (Heap)', value: `${heapUsed} / ${heapTotal} MB`, inline: true },
      { name: '💽 Память (RSS)', value: `${rss} MB`, inline: true },
      { name: '🖥️ Система', value: `${freeMem} / ${totalMem} GB свободно`, inline: true },
      { name: '📦 Node.js', value: process.version, inline: true },
      { name: '🤖 Discord.js', value: `v${djsVersion}`, inline: true },
      { name: '💻 Платформа', value: `${os.platform()} ${os.arch()}`, inline: true },
      { name: '🏆 Топ команд', value: topCommandsStr, inline: false }
    )
    .setFooter({ text: `Запущен: ${stats.startTime.toLocaleString('uk-UA')}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
