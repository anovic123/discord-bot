import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const chooseCommand = new SlashCommandBuilder()
  .setName('choose')
  .setDescription('Выбрать случайный вариант из списка')
  .addStringOption((option) =>
    option
      .setName('options')
      .setDescription('Варианты через запятую (пример: пицца, суши, бургер)')
      .setRequired(true)
  );

export async function handleChooseCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const input = interaction.options.getString('options', true);
  const options = input
    .split(',')
    .map((opt) => opt.trim())
    .filter((opt) => opt.length > 0);

  if (options.length < 2) {
    await interaction.reply({
      content: '❌ Укажите минимум 2 варианта через запятую!',
      ephemeral: true,
    });
    return;
  }

  const choice = options[Math.floor(Math.random() * options.length)];

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🤔 Выбираю...')
    .addFields(
      { name: '📋 Варианты', value: options.map((opt, i) => `${i + 1}. ${opt}`).join('\n') },
      { name: '✨ Выбор', value: `**${choice}**` }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
