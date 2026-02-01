import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GetCryptoUseCase } from '../../../application/get-crypto.use-case';

export const cryptoCommand = new SlashCommandBuilder()
  .setName('crypto')
  .setDescription('Курс криптовалют (BTC, ETH, TON)');

export async function handleCryptoCommand(
  interaction: ChatInputCommandInteraction,
  getCryptoUseCase: GetCryptoUseCase
): Promise<void> {
  await interaction.deferReply();

  try {
    const message = await getCryptoUseCase.execute();
    await interaction.editReply(message);
  } catch (error) {
    console.error('Failed to get crypto rates:', error);
    await interaction.editReply('❌ Не удалось получить курс криптовалют. Попробуйте позже.');
  }
}
