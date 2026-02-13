import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../logger';

const logger = createLogger('Settings');

export interface DailyReportSettings {
  currencyRates: boolean;
  cryptoRates: boolean;
  serverStats: boolean;
}

export interface WelcomeSettings {
  startupMessage: boolean;
}

export interface ModerationSettings {
  auditLog: boolean;
}

export interface GuildSettings {
  guildId: string;
  dailyReport: DailyReportSettings;
  welcome: WelcomeSettings;
  moderation: ModerationSettings;
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
  },
  moderation: {
    auditLog: true,
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
    },
    userId: string
  ): GuildSettings {
    const current = this.getSettings(guildId);

    const updated: GuildSettings = {
      ...current,
      dailyReport: { ...current.dailyReport, ...partial.dailyReport },
      welcome: { ...current.welcome, ...partial.welcome },
      moderation: { ...current.moderation, ...partial.moderation },
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    this.save(guildId, updated);
    logger.info(`Settings updated for guild ${guildId} by ${userId}`);
    return updated;
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
