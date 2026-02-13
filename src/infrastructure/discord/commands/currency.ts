import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GetRatesUseCase } from '../../../application/get-rates.use-case';
import { logCommandError } from '../utils/error-handler';

export const currencyCommand = new SlashCommandBuilder()
  .setName('currency')
  .setDescription('Показать актуальный курс валют (USD, EUR, PLN к UAH)');

export async function handleCurrencyCommand(
  interaction: ChatInputCommandInteraction,
  getRatesUseCase: GetRatesUseCase
): Promise<void> {
  await interaction.deferReply();

  try {
    const message = await getRatesUseCase.execute();
    await interaction.editReply(message);
  } catch (error) {
    logCommandError('currency', error);
    await interaction.editReply('❌ Не удалось получить курсы валют. Попробуйте позже.');
  }
}
