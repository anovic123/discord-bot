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

  it('should merge ai partial update correctly', () => {
    const updated = manager.updateSettings('guild-1', { ai: { maxRequestsPerDay: 100 } }, 'admin');

    expect(updated.ai.maxRequestsPerDay).toBe(100);
    expect(updated.ai.askEnabled).toBe(true);
    expect(updated.ai.temperature).toBe(0.7);
  });

  it('should merge logging partial update correctly', () => {
    const updated = manager.updateSettings(
      'guild-2',
      { logging: { channelId: '123456', messageDelete: false } },
      'admin'
    );

    expect(updated.logging.channelId).toBe('123456');
    expect(updated.logging.messageDelete).toBe(false);
    expect(updated.logging.messageEdit).toBe(true);
    expect(updated.logging.memberJoinLeave).toBe(true);
  });

  it('should not overwrite other category fields on partial update', () => {
    manager.updateSettings('guild-3', { ai: { cooldownSeconds: 30 } }, 'admin');
    const updated = manager.updateSettings('guild-3', { logging: { channelId: '999' } }, 'admin');

    expect(updated.ai.cooldownSeconds).toBe(30);
    expect(updated.logging.channelId).toBe('999');
    expect(updated.dailyReport.currencyRates).toBe(true);
  });

  it('should have correct default values', () => {
    const settings = manager.getSettings('defaults-guild');

    expect(settings.ai.temperature).toBe(0.7);
    expect(settings.ai.maxRequestsPerDay).toBe(50);
    expect(settings.logging.channelId).toBe('');
  });
});
