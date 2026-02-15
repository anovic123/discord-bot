import { guildSettings } from '../../settings';

interface UserTracker {
  count: number;
  dayStart: number;
  lastUsed: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

class AIRateLimiter {
  private trackers = new Map<string, UserTracker>();

  private key(guildId: string, userId: string): string {
    return `${guildId}:${userId}`;
  }

  private getTracker(guildId: string, userId: string): UserTracker {
    const k = this.key(guildId, userId);
    let tracker = this.trackers.get(k);
    const now = Date.now();

    if (!tracker || now - tracker.dayStart >= DAY_MS) {
      tracker = { count: 0, dayStart: now, lastUsed: 0 };
      this.trackers.set(k, tracker);
    }

    return tracker;
  }

  check(guildId: string, userId: string): { allowed: boolean; reason?: string } {
    const settings = guildSettings.getSettings(guildId);
    const { maxRequestsPerDay, cooldownSeconds } = settings.ai;
    const tracker = this.getTracker(guildId, userId);
    const now = Date.now();

    if (tracker.count >= maxRequestsPerDay) {
      return { allowed: false, reason: `Достигнут лимит AI-запросов (${maxRequestsPerDay}/день).` };
    }

    const cooldownMs = cooldownSeconds * 1000;
    const elapsed = now - tracker.lastUsed;
    if (tracker.lastUsed > 0 && elapsed < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
      return { allowed: false, reason: `Подождите ${remaining} сек. перед следующим AI-запросом.` };
    }

    return { allowed: true };
  }

  consume(guildId: string, userId: string): void {
    const tracker = this.getTracker(guildId, userId);
    tracker.count++;
    tracker.lastUsed = Date.now();
  }

  getRemainingToday(guildId: string, userId: string): number {
    const settings = guildSettings.getSettings(guildId);
    const tracker = this.getTracker(guildId, userId);
    return Math.max(0, settings.ai.maxRequestsPerDay - tracker.count);
  }
}

export const aiRateLimiter = new AIRateLimiter();
