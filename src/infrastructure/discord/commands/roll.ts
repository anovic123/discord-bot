import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const rollCommand = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Бросить кости')
  .addIntegerOption((option) =>
    option
      .setName('dice')
      .setDescription('Количество костей (1-10)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(10)
  )
  .addIntegerOption((option) =>
    option
      .setName('sides')
      .setDescription('Количество граней (2-100)')
      .setRequired(false)
      .setMinValue(2)
      .setMaxValue(100)
  );

export async function handleRollCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const diceCount = interaction.options.getInteger('dice') ?? 1;
  const sides = interaction.options.getInteger('sides') ?? 6;

  const rolls: number[] = [];
  for (let i = 0; i < diceCount; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  const total = rolls.reduce((a, b) => a + b, 0);
  const diceEmoji = sides === 6 ? '🎲' : '🎯';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${diceEmoji} Бросок костей`)
    .addFields(
      { name: '🎯 Результаты', value: rolls.join(', '), inline: true },
      { name: '📊 Сумма', value: `**${total}**`, inline: true },
      { name: '⚙️ Параметры', value: `${diceCount}d${sides}`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
