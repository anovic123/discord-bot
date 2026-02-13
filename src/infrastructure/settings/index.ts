import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../logger';

const logger = createLogger('Settings');

export interface DailyReportSettings {
  currencyRates: boolean;
  cryptoRates: boolean;
  serverStats: boolean;
}

export interface WelcomeMessageConfig {
  enabled: boolean;
  title: string;
  description: string;
  color: number;
}

export interface WelcomeSettings {
  startupMessage: boolean;
  welcomeMessage: boolean;
}

export interface ModerationSettings {
  auditLog: boolean;
}

export interface ToxicModeSettings {
  enabled: boolean;
  channelId: string;
  frequencyMinutes: number;
  maxPerDay: number;
}

export interface GuildSettings {
  guildId: string;
  dailyReport: DailyReportSettings;
  welcome: WelcomeSettings;
  moderation: ModerationSettings;
  welcomeMessage: WelcomeMessageConfig;
  toxicMode: ToxicModeSettings;
  updatedAt: string;
  updatedBy: string;
}

const DEFAULT_SETTINGS: Omit<GuildSettings, 'guildId' | 'updatedAt' | 'updatedBy'> = {
  dailyReport: {
    currencyRates: true,
    cryptoRates: true,
    serverStats: true,
  },
  welcome: {
    startupMessage: true,
    welcomeMessage: true,
  },
  moderation: {
    auditLog: true,
  },
  welcomeMessage: {
    enabled: true,
    title: 'Добро пожаловать!',
    description: 'Привет, {user}! Добро пожаловать на **{server}**! Ты {memberCount}-й участник.',
    color: 0x57f287,
  },
  toxicMode: {
    enabled: false,
    channelId: '',
    frequencyMinutes: 15,
    maxPerDay: 20,
  },
};

class GuildSettingsManager {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(process.cwd(), 'data', 'guild-settings.json');
    this.ensureFile();
  }

  private ensureFile(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, '{}');
      }
    } catch (error) {
      logger.warn('Could not create settings file', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  getSettings(guildId: string): GuildSettings {
    const all = this.loadAll();
    if (all[guildId]) return all[guildId];

    return {
      guildId,
      ...structuredClone(DEFAULT_SETTINGS),
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
  }

  updateSettings(
    guildId: string,
    partial: {
      dailyReport?: Partial<DailyReportSettings>;
      welcome?: Partial<WelcomeSettings>;
      moderation?: Partial<ModerationSettings>;
      welcomeMessage?: Partial<WelcomeMessageConfig>;
      toxicMode?: Partial<ToxicModeSettings>;
    },
    userId: string
  ): GuildSettings {
    const current = this.getSettings(guildId);

    const updated: GuildSettings = {
      ...current,
      dailyReport: { ...current.dailyReport, ...partial.dailyReport },
      welcome: { ...current.welcome, ...partial.welcome },
      moderation: { ...current.moderation, ...partial.moderation },
      welcomeMessage: { ...current.welcomeMessage, ...partial.welcomeMessage },
      toxicMode: { ...current.toxicMode, ...partial.toxicMode },
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    this.save(guildId, updated);
    logger.info(`Settings updated for guild ${guildId} by ${userId}`);
    return updated;
  }

  getWelcomeMessage(guildId: string): WelcomeMessageConfig {
    return this.getSettings(guildId).welcomeMessage;
  }

  setWelcomeMessage(guildId: string, config: Partial<WelcomeMessageConfig>, userId: string): GuildSettings {
    return this.updateSettings(guildId, { welcomeMessage: config }, userId);
  }

  resetSettings(guildId: string, userId: string): GuildSettings {
    const settings: GuildSettings = {
      guildId,
      ...structuredClone(DEFAULT_SETTINGS),
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    this.save(guildId, settings);
    logger.info(`Settings reset for guild ${guildId} by ${userId}`);
    return settings;
  }

  getAllGuildIds(): string[] {
    return Object.keys(this.loadAll());
  }

  private loadAll(): Record<string, GuildSettings> {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private save(guildId: string, settings: GuildSettings): void {
    try {
      const all = this.loadAll();
      all[guildId] = settings;
      fs.writeFileSync(this.filePath, JSON.stringify(all, null, 2));
    } catch (error) {
      logger.error('Failed to save settings', error);
    }
  }
}

export const guildSettings = new GuildSettingsManager();
