import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const coinflipCommand = new SlashCommandBuilder()
  .setName('coinflip')
  .setDescription('Подбросить монетку');

export async function handleCoinflipCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const result = Math.random() < 0.5;
  const side = result ? 'Орёл' : 'Решка';
  const emoji = result ? '🦅' : '💰';

  const embed = new EmbedBuilder()
    .setColor(result ? 0xFFD700 : 0xC0C0C0)
    .setTitle('🪙 Подбрасываю монетку...')
    .setDescription(`${emoji} **${side}!**`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
