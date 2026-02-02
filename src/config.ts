import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  CHANNEL_ID: z.string().min(1, 'CHANNEL_ID is required'),
  GUILD_ID: z.string().min(1, 'GUILD_ID is required'),
  WELCOME_CHANNEL_ID: z.string().optional().default(''),
  CRON_TIME: z.string().optional().default('0 9 * * *'),
  TIMEZONE: z.string().optional().default('Europe/Kyiv'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export interface Config {
  discordToken: string;
  channelId: string;
  welcomeChannelId: string;
  guildId: string;
  cronTime: string;
  timezone: string;
  logLevel: string;
}

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${String(issue.path.join('.'))}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  const env = result.data;

  return {
    discordToken: env.DISCORD_TOKEN,
    channelId: env.CHANNEL_ID,
    welcomeChannelId: env.WELCOME_CHANNEL_ID,
    guildId: env.GUILD_ID,
    cronTime: env.CRON_TIME,
    timezone: env.TIMEZONE,
    logLevel: env.LOG_LEVEL,
  };
}
