import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AuditLogger, AuditEntry } from './index';

describe('AuditLogger', () => {
  let tmpFile: string;
  let logger: AuditLogger;

  function createEntry(
    overrides: Partial<Omit<AuditEntry, 'timestamp'>> = {}
  ): Omit<AuditEntry, 'timestamp'> {
    return {
      action: 'ban',
      moderatorId: 'mod-1',
      moderatorTag: 'Mod#0001',
      guildId: 'guild-1',
      ...overrides,
    };
  }

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `audit-test-${Date.now()}.json`);
    logger = new AuditLogger(tmpFile);
  });

  afterEach(() => {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* */
    }
  });

  it('should add timestamp to log entries', () => {
    logger.log(createEntry());
    const entries = logger.getRecent(10);

    expect(entries).toHaveLength(1);
    expect(entries[0].timestamp).toBeDefined();
    expect(new Date(entries[0].timestamp).getTime()).not.toBeNaN();
  });

  it('should auto-flush when buffer reaches maxBufferSize (10)', () => {
    for (let i = 0; i < 10; i++) {
      logger.log(createEntry({ action: `action-${i}` }));
    }

    const raw = fs.readFileSync(tmpFile, 'utf-8');
    const entries: AuditEntry[] = JSON.parse(raw);
    expect(entries).toHaveLength(10);
  });

  it('should return entries in reverse order via getRecent', () => {
    logger.log(createEntry({ action: 'first' }));
    logger.log(createEntry({ action: 'second' }));
    logger.log(createEntry({ action: 'third' }));

    const entries = logger.getRecent(10);
    expect(entries[0].action).toBe('third');
    expect(entries[2].action).toBe('first');
  });

  it('should filter by moderatorId via getByModerator', () => {
    logger.log(createEntry({ moderatorId: 'mod-A' }));
    logger.log(createEntry({ moderatorId: 'mod-B' }));
    logger.log(createEntry({ moderatorId: 'mod-A' }));

    const entries = logger.getByModerator('mod-A');
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.moderatorId === 'mod-A')).toBe(true);
  });

  it('should filter by targetId via getByTarget', () => {
    logger.log(createEntry({ targetId: 'target-X' }));
    logger.log(createEntry({ targetId: 'target-Y' }));
    logger.log(createEntry({ targetId: 'target-X' }));

    const entries = logger.getByTarget('target-X');
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.targetId === 'target-X')).toBe(true);
  });

  it('should trim to 10000 entries on flush', () => {
    const bigData: AuditEntry[] = Array.from({ length: 10_005 }, (_, i) => ({
      timestamp: new Date().toISOString(),
      action: `action-${i}`,
      moderatorId: 'mod-1',
      moderatorTag: 'Mod#0001',
      guildId: 'guild-1',
    }));
    fs.writeFileSync(tmpFile, JSON.stringify(bigData));

    logger.log(createEntry({ action: 'new-entry' }));
    logger.flush();

    const raw = fs.readFileSync(tmpFile, 'utf-8');
    const entries: AuditEntry[] = JSON.parse(raw);
    expect(entries).toHaveLength(10_000);
    expect(entries[entries.length - 1].action).toBe('new-entry');
  });
});
