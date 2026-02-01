import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  discordToken: string;
  channelId: string;
  welcomeChannelId: string;
  guildId: string;
  cronTime: string;
  timezone: string;
}

export function loadConfig(): Config {
  const config: Config = {
    discordToken: process.env.DISCORD_TOKEN || '',
    channelId: process.env.CHANNEL_ID || '',
    welcomeChannelId: process.env.WELCOME_CHANNEL_ID || '',
    guildId: process.env.GUILD_ID || '',
    cronTime: process.env.CRON_TIME || '0 9 * * *',
    timezone: process.env.TIMEZONE || 'Europe/Kyiv',
  };

  if (!config.discordToken) {
    throw new Error('DISCORD_TOKEN is not set');
  }

  if (!config.channelId) {
    throw new Error('CHANNEL_ID is not set');
  }

  if (!config.guildId) {
    throw new Error('GUILD_ID is not set');
  }

  return config;
}
