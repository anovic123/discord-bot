import { createLogger } from '../logger';

const logger = createLogger('Cooldown');

interface CooldownEntry {
  lastUsed: number;
  count: number;
  windowStart: number;
}

interface CooldownConfig {
  windowMs: number;
  maxCommands: number;
  cooldownMs: number;
}

const DEFAULT_CONFIG: CooldownConfig = {
  windowMs: 60000,
  maxCommands: 30,
  cooldownMs: 5000,
};

const COOLDOWN_CLEAN_TIME = 300000;

class CooldownManager {
  private userCooldowns: Map<string, CooldownEntry> = new Map();
  private config: CooldownConfig;

  constructor(config: Partial<CooldownConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  check(userId: string, commandName: string): { allowed: boolean; remainingMs?: number } {
    const key = `${userId}:${commandName}`;
    const now = Date.now();
    let entry = this.userCooldowns.get(key);

    if (!entry || now - entry.windowStart >= this.config.windowMs) {
      entry = { lastUsed: now, count: 1, windowStart: now };
      this.userCooldowns.set(key, entry);
      return { allowed: true };
    }

    if (entry.count >= this.config.maxCommands) {
      const remainingMs = this.config.cooldownMs - (now - entry.lastUsed);
      if (remainingMs > 0) {
        logger.debug(`Cooldown active for ${userId} on ${commandName}`, { remainingMs });
        return { allowed: false, remainingMs };
      }
      entry.count = 1;
      entry.lastUsed = now;
      entry.windowStart = now;
      return { allowed: true };
    }

    entry.count++;
    entry.lastUsed = now;
    return { allowed: true };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.userCooldowns.entries()) {
      if (now - entry.windowStart >= this.config.windowMs * 2) {
        this.userCooldowns.delete(key);
      }
    }
  }
}

export const cooldownManager = new CooldownManager();

setInterval(() => cooldownManager.cleanup(), COOLDOWN_CLEAN_TIME);
