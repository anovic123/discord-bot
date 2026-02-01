import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const reverseCommand = new SlashCommandBuilder()
  .setName('reverse')
  .setDescription('Перевернуть текст')
  .addStringOption(option =>
    option
      .setName('text')
      .setDescription('Текст для переворота')
      .setRequired(true)
  );

export async function handleReverseCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const text = interaction.options.getString('text', true);
  const reversed = [...text].reverse().join('');

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🔄 Перевёрнутый текст')
    .addFields(
      { name: '📝 Оригинал', value: text.slice(0, 500) },
      { name: '🔄 Результат', value: reversed.slice(0, 500) }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
