import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const timestampCommand = new SlashCommandBuilder()
  .setName('timestamp')
  .setDescription('Создать Discord timestamp')
  .addStringOption(option =>
    option.setName('date')
      .setDescription('Дата (DD.MM.YYYY или YYYY-MM-DD)')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('time')
      .setDescription('Время (HH:MM)')
      .setRequired(false))
  .addIntegerOption(option =>
    option.setName('minutes')
      .setDescription('Или: через сколько минут')
      .setRequired(false));

export async function handleTimestampCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const dateStr = interaction.options.getString('date');
  const timeStr = interaction.options.getString('time');
  const minutes = interaction.options.getInteger('minutes');

  let timestamp: number;

  if (minutes !== null) {
    timestamp = Math.floor((Date.now() + minutes * 60 * 1000) / 1000);
  } else {
    let date = new Date();

    if (dateStr) {
      const parts = dateStr.includes('.')
        ? dateStr.split('.').reverse().join('-')
        : dateStr;
      const parsed = new Date(parts);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      }
    }

    if (timeStr) {
      const [hours, mins] = timeStr.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(mins)) {
        date.setHours(hours, mins, 0, 0);
      }
    }

    timestamp = Math.floor(date.getTime() / 1000);
  }

  const formats = [
    { name: 'Короткое время', format: 't', example: `<t:${timestamp}:t>` },
    { name: 'Длинное время', format: 'T', example: `<t:${timestamp}:T>` },
    { name: 'Короткая дата', format: 'd', example: `<t:${timestamp}:d>` },
    { name: 'Длинная дата', format: 'D', example: `<t:${timestamp}:D>` },
    { name: 'Дата и время', format: 'f', example: `<t:${timestamp}:f>` },
    { name: 'Полная дата', format: 'F', example: `<t:${timestamp}:F>` },
    { name: 'Относительное', format: 'R', example: `<t:${timestamp}:R>` },
  ];

  const formatsList = formats.map(f =>
    `**${f.name}:** ${f.example}\n\`<t:${timestamp}:${f.format}>\``
  ).join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🕐 Discord Timestamp')
    .setDescription(formatsList)
    .addFields(
      { name: '📋 Unix timestamp', value: `\`${timestamp}\``, inline: true }
    )
    .setFooter({ text: 'Скопируйте нужный формат' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
