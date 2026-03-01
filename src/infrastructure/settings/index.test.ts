import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { GuildSettingsManager } from './index';

describe('GuildSettingsManager', () => {
  let tmpFile: string;
  let manager: GuildSettingsManager;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `guild-settings-test-${Date.now()}.json`);
    manager = new GuildSettingsManager(tmpFile);
  });

  afterEach(() => {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* */
    }
  });

  it('should return default ai and logging settings for a new guild', () => {
    const settings = manager.getSettings('new-guild');

    expect(settings.ai).toBeDefined();
    expect(settings.logging).toBeDefined();
    expect(settings.guildId).toBe('new-guild');
  });

  it('should have spam-related defaults set to false', () => {
    const settings = manager.getSettings('defaults-guild');

    expect(settings.dailyReport.cryptoRates).toBe(false);
    expect(settings.dailyReport.serverStats).toBe(false);
    expect(settings.dailyReport.currencyRates).toBe(false);
    expect(settings.welcome.startupMessage).toBe(false);
    expect(settings.welcome.welcomeMessage).toBe(false);
  });

  it('should have correct default AI settings with new fields', () => {
    const settings = manager.getSettings('defaults-guild');

    expect(settings.ai.temperature).toBe(0.7);
    expect(settings.ai.maxRequestsPerDay).toBe(50);
    expect(settings.ai.provider).toBe('groq');
    expect(settings.ai.model).toBe('');
    expect(settings.ai.groqApiKey).toBe('');
    expect(settings.ai.openaiApiKey).toBe('');
  });

  it('should have logging.userIds as empty array by default', () => {
    const settings = manager.getSettings('defaults-guild');

    expect(settings.logging.userIds).toEqual([]);
    expect(settings.logging.messageDelete).toBe(true);
  });

  it('should merge ai partial update correctly', () => {
    const updated = manager.updateSettings('guild-1', { ai: { maxRequestsPerDay: 100 } }, 'admin');

    expect(updated.ai.maxRequestsPerDay).toBe(100);
    expect(updated.ai.askEnabled).toBe(true);
    expect(updated.ai.temperature).toBe(0.7);
  });

  it('should merge logging partial update correctly', () => {
    const updated = manager.updateSettings(
      'guild-2',
      { logging: { userIds: ['111', '222'], messageDelete: false } },
      'admin'
    );

    expect(updated.logging.userIds).toEqual(['111', '222']);
    expect(updated.logging.messageDelete).toBe(false);
    expect(updated.logging.messageEdit).toBe(true);
    expect(updated.logging.memberJoinLeave).toBe(true);
  });

  it('should not overwrite other category fields on partial update', () => {
    manager.updateSettings('guild-3', { ai: { cooldownSeconds: 30 } }, 'admin');
    const updated = manager.updateSettings('guild-3', { logging: { userIds: ['999'] } }, 'admin');

    expect(updated.ai.cooldownSeconds).toBe(30);
    expect(updated.logging.userIds).toEqual(['999']);
    expect(updated.dailyReport.currencyRates).toBe(false);
  });

  it('should migrate legacy channelId to userIds', () => {
    const legacySettings = {
      'legacy-guild': {
        guildId: 'legacy-guild',
        dailyReport: {
          currencyRates: false,
          cryptoRates: false,
          serverStats: false,
          currencies: ['USD'],
        },
        welcome: { startupMessage: false, welcomeMessage: false },
        moderation: { auditLog: true },
        ai: {
          askEnabled: true,
          roastEnabled: true,
          aiSummaryEnabled: true,
          maxRequestsPerDay: 50,
          cooldownSeconds: 10,
          temperature: 0.7,
          provider: 'groq',
        },
        logging: {
          channelId: '123456',
          messageDelete: true,
          messageEdit: true,
          memberJoinLeave: true,
          nicknameChanges: true,
          voiceActivity: true,
        },
        welcomeMessage: { enabled: true, title: 'Test', description: 'Test', color: 0x57f287 },
        toxicMode: { enabled: false, channelId: '', frequencyMinutes: 15, maxPerDay: 20 },
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
      },
    };
    fs.writeFileSync(tmpFile, JSON.stringify(legacySettings));

    const settings = manager.getSettings('legacy-guild');
    expect(settings.logging.userIds).toEqual([]);
    expect((settings.logging as unknown as Record<string, unknown>).channelId).toBeUndefined();
  });
});
