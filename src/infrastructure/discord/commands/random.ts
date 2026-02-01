import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const randomCommand = new SlashCommandBuilder()
  .setName('random')
  .setDescription('Сгенерировать случайное число')
  .addIntegerOption(option =>
    option.setName('min')
      .setDescription('Минимальное значение')
      .setRequired(false))
  .addIntegerOption(option =>
    option.setName('max')
      .setDescription('Максимальное значение')
      .setRequired(false));

export async function handleRandomCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const min = interaction.options.getInteger('min') ?? 1;
  const max = interaction.options.getInteger('max') ?? 100;

  if (min >= max) {
    await interaction.reply({ content: '❌ Минимальное значение должно быть меньше максимального!', ephemeral: true });
    return;
  }

  const result = Math.floor(Math.random() * (max - min + 1)) + min;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🎲 Случайное число')
    .setDescription(`**${result}**`)
    .addFields({ name: 'Диапазон', value: `${min} - ${max}`, inline: true })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
