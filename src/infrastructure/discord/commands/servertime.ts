import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const servertimeCommand = new SlashCommandBuilder()
  .setName('servertime')
  .setDescription('Показать текущее время в разных часовых поясах');

export async function handleServertimeCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const now = new Date();

  const timezones = [
    { name: '🇺🇦 Киев', zone: 'Europe/Kyiv' },
    { name: '🇷🇺 Москва', zone: 'Europe/Moscow' },
    { name: '🇬🇧 Лондон', zone: 'Europe/London' },
    { name: '🇺🇸 Нью-Йорк', zone: 'America/New_York' },
    { name: '🇯🇵 Токио', zone: 'Asia/Tokyo' },
  ];

  const timeFields = timezones.map((tz) => ({
    name: tz.name,
    value: now.toLocaleString('uk-UA', {
      timeZone: tz.zone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    inline: true,
  }));

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🌍 Мировое время')
    .addFields(timeFields)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
