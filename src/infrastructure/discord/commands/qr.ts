import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const qrCommand = new SlashCommandBuilder()
  .setName('qr')
  .setDescription('Сгенерировать QR-код')
  .addStringOption(option =>
    option.setName('text')
      .setDescription('Текст или ссылка для QR-кода')
      .setRequired(true)
      .setMaxLength(500))
  .addIntegerOption(option =>
    option.setName('size')
      .setDescription('Размер QR-кода (100-500)')
      .setRequired(false)
      .setMinValue(100)
      .setMaxValue(500));

export async function handleQrCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const text = interaction.options.getString('text', true);
  const size = interaction.options.getInteger('size') ?? 200;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📱 QR-код')
    .setDescription(`Содержимое: \`${text.length > 100 ? text.substring(0, 100) + '...' : text}\``)
    .setImage(qrUrl)
    .setFooter({ text: `Размер: ${size}x${size}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
