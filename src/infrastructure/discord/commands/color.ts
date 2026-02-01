import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const colorCommand = new SlashCommandBuilder()
  .setName('color')
  .setDescription('Информация о цвете')
  .addStringOption(option =>
    option
      .setName('hex')
      .setDescription('Цвет в формате HEX (например: FF5500 или #FF5500)')
      .setRequired(true)
  );

export async function handleColorCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  let hex = interaction.options.getString('hex', true);
  hex = hex.replace('#', '').toUpperCase();

  if (!/^[0-9A-F]{6}$/i.test(hex)) {
    await interaction.reply({ content: '❌ Неверный формат цвета. Используйте HEX (например: FF5500).', ephemeral: true });
    return;
  }

  const decimal = parseInt(hex, 16);
  const r = (decimal >> 16) & 255;
  const g = (decimal >> 8) & 255;
  const b = decimal & 255;

  const embed = new EmbedBuilder()
    .setColor(decimal)
    .setTitle(`🎨 Цвет #${hex}`)
    .addFields(
      { name: 'HEX', value: `#${hex}`, inline: true },
      { name: 'RGB', value: `${r}, ${g}, ${b}`, inline: true },
      { name: 'Decimal', value: `${decimal}`, inline: true }
    )
    .setImage(`https://singlecolorimage.com/get/${hex}/400x100`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
