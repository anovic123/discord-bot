import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { logCommandError } from '../utils/error-handler';

const languages: Record<string, string> = {
  uk: 'Украинский',
  en: 'Английский',
  ru: 'Русский',
  de: 'Немецкий',
  fr: 'Французский',
  es: 'Испанский',
  pl: 'Польский',
  ja: 'Японский',
  ko: 'Корейский',
  zh: 'Китайский',
};

export const translateCommand = new SlashCommandBuilder()
  .setName('translate')
  .setDescription('Перевести текст')
  .addStringOption(option =>
    option.setName('text')
      .setDescription('Текст для перевода')
      .setRequired(true)
      .setMaxLength(500))
  .addStringOption(option =>
    option.setName('to')
      .setDescription('На какой язык перевести')
      .setRequired(true)
      .addChoices(
        { name: 'Украинский', value: 'uk' },
        { name: 'Английский', value: 'en' },
        { name: 'Русский', value: 'ru' },
        { name: 'Немецкий', value: 'de' },
        { name: 'Французский', value: 'fr' },
        { name: 'Испанский', value: 'es' },
        { name: 'Польский', value: 'pl' }
      ));

export async function handleTranslateCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const text = interaction.options.getString('text', true);
  const targetLang = interaction.options.getString('to', true);

  await interaction.deferReply();

  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`
    );

    if (!response.ok) {
      throw new Error('API error');
    }

    const data = await response.json() as {
      responseStatus: number;
      responseData: { translatedText: string };
      matches?: Array<{ source: string }>;
    };

    if (data.responseStatus !== 200) {
      throw new Error('Translation failed');
    }

    const translated = data.responseData.translatedText;
    const detectedLang = data.matches?.[0]?.source || 'auto';

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🌐 Перевод')
      .addFields(
        { name: '📝 Оригинал', value: text.length > 500 ? text.substring(0, 500) + '...' : text },
        { name: `🔄 ${languages[targetLang] || targetLang}`, value: translated.length > 500 ? translated.substring(0, 500) + '...' : translated }
      )
      .setFooter({ text: `Определён язык: ${detectedLang}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logCommandError("translate", error);

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ Ошибка перевода')
      .setDescription('Не удалось выполнить перевод. Попробуйте позже.')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}
