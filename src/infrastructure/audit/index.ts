import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../logger';

const logger = createLogger('Audit');

export interface AuditEntry {
  timestamp: string;
  action: string;
  moderatorId: string;
  moderatorTag: string;
  targetId?: string;
  targetTag?: string;
  guildId: string;
  channelId?: string;
  reason?: string;
  details?: Record<string, unknown>;
}

class AuditLogger {
  private readonly filePath: string;
  private buffer: AuditEntry[] = [];
  private readonly maxBufferSize = 10;

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(process.cwd(), 'data', 'audit-log.json');
    this.ensureFile();
  }

  private ensureFile(): void {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, '[]');
      }
    } catch (error) {
      logger.warn('Could not create audit log file, logging to memory only', error);
    }
  }

  log(entry: Omit<AuditEntry, 'timestamp'>): void {
    const fullEntry: AuditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.buffer.push(fullEntry);
    logger.info(`Audit: ${entry.action}`, {
      moderator: entry.moderatorTag,
      target: entry.targetTag,
    });

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;

    try {
      const existing = this.load();
      existing.push(...this.buffer);

      const trimmed = existing.slice(-10000);
      fs.writeFileSync(this.filePath, JSON.stringify(trimmed, null, 2));
      this.buffer = [];
    } catch (error) {
      logger.error('Failed to flush audit log', error);
    }
  }

  private load(): AuditEntry[] {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  getRecent(limit = 50): AuditEntry[] {
    this.flush();
    const entries = this.load();
    return entries.slice(-limit).reverse();
  }

  getByModerator(moderatorId: string, limit = 50): AuditEntry[] {
    this.flush();
    const entries = this.load();
    return entries
      .filter((e) => e.moderatorId === moderatorId)
      .slice(-limit)
      .reverse();
  }

  getByTarget(targetId: string, limit = 50): AuditEntry[] {
    this.flush();
    const entries = this.load();
    return entries
      .filter((e) => e.targetId === targetId)
      .slice(-limit)
      .reverse();
  }
}

export const auditLogger = new AuditLogger();

process.on('beforeExit', () => auditLogger.flush());
process.on('SIGINT', () => auditLogger.flush());
