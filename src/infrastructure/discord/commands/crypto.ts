import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GetCryptoUseCase } from '../../../application/get-crypto.use-case';
import { logCommandError } from '../utils/error-handler';

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
    logCommandError('crypto', error);
    await interaction.editReply('❌ Не удалось получить курс криптовалют. Попробуйте позже.');
  }
}
