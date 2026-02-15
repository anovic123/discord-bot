import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { GetRatesUseCase } from '../../../application/get-rates.use-case';
import { logCommandError } from '../utils/error-handler';
import { guildSettings } from '../../settings';

export const currencyCommand = new SlashCommandBuilder()
  .setName('currency')
  .setDescription('Показать актуальный курс валют к UAH');

export async function handleCurrencyCommand(
  interaction: ChatInputCommandInteraction,
  getRatesUseCase: GetRatesUseCase
): Promise<void> {
  await interaction.deferReply();

  try {
    const guildId = interaction.guildId || '';
    const settings = guildSettings.getSettings(guildId);
    const message = await getRatesUseCase.execute(settings.dailyReport.currencies);
    await interaction.editReply(message);
  } catch (error) {
    logCommandError('currency', error);
    await interaction.editReply('❌ Не удалось получить курсы валют. Попробуйте позже.');
  }
}
