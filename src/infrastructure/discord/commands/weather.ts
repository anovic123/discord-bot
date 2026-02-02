import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { logCommandError } from '../utils/error-handler';
import { createLogger } from '../../logger';

const logger = createLogger('Weather');

interface WeatherResponse {
  name: string;
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
}

export const weatherCommand = new SlashCommandBuilder()
  .setName('weather')
  .setDescription('Показать погоду (требуется API ключ)')
  .addStringOption(option =>
    option.setName('city')
      .setDescription('Название города')
      .setRequired(true));

export async function handleWeatherCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const city = interaction.options.getString('city', true);

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    const embed = new EmbedBuilder()
      .setColor(0xFF9900)
      .setTitle('⚠️ Погода недоступна')
      .setDescription('API ключ OpenWeatherMap не настроен.\nДобавьте `OPENWEATHER_API_KEY` в переменные окружения.')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=uk`;
    logger.debug('Weather API request', { city });

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn('Weather API error', { status: response.status, errorText });
      throw new Error('City not found');
    }

    const data = await response.json() as WeatherResponse;

    const weatherEmoji: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '🌨️',
      'Mist': '🌫️',
      'Fog': '🌫️',
    };

    const emoji = weatherEmoji[data.weather[0].main] || '🌡️';

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`${emoji} Погода в ${data.name}`)
      .addFields(
        { name: '🌡️ Температура', value: `${Math.round(data.main.temp)}°C`, inline: true },
        { name: '💨 Ветер', value: `${data.wind.speed} м/с`, inline: true },
        { name: '💧 Влажность', value: `${data.main.humidity}%`, inline: true },
        { name: '📊 Давление', value: `${data.main.pressure} гПа`, inline: true },
        { name: '🌤️ Описание', value: data.weather[0].description, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logCommandError("weather", error);

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ Ошибка')
      .setDescription(`Не удалось найти город "${city}"`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}
