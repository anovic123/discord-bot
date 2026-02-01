import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ConvertUseCase } from '../../../application/convert.use-case';

export const convertCommand = new SlashCommandBuilder()
  .setName('convert')
  .setDescription('Конвертировать валюту')
  .addNumberOption(option =>
    option
      .setName('amount')
      .setDescription('Сумма для конвертации')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('from')
      .setDescription('Из какой валюты')
      .setRequired(true)
      .addChoices(
        { name: 'UAH 🇺🇦', value: 'UAH' },
        { name: 'USD 🇺🇸', value: 'USD' },
        { name: 'EUR 🇪🇺', value: 'EUR' },
        { name: 'PLN 🇵🇱', value: 'PLN' }
      )
  )
  .addStringOption(option =>
    option
      .setName('to')
      .setDescription('В какую валюту')
      .setRequired(true)
      .addChoices(
        { name: 'UAH 🇺🇦', value: 'UAH' },
        { name: 'USD 🇺🇸', value: 'USD' },
        { name: 'EUR 🇪🇺', value: 'EUR' },
        { name: 'PLN 🇵🇱', value: 'PLN' }
      )
  );

export async function handleConvertCommand(
  interaction: ChatInputCommandInteraction,
  convertUseCase: ConvertUseCase
): Promise<void> {
  await interaction.deferReply();

  const amount = interaction.options.getNumber('amount', true);
  const from = interaction.options.getString('from', true);
  const to = interaction.options.getString('to', true);

  try {
    const message = await convertUseCase.execute(amount, from, to);
    await interaction.editReply(message);
  } catch (error) {
    console.error('Failed to convert:', error);
    await interaction.editReply('❌ Не удалось выполнить конвертацию. Попробуйте позже.');
  }
}
