import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../settings', () => ({
  guildSettings: {
    getSettings: vi.fn().mockReturnValue({
      ai: { maxRequestsPerDay: 5, cooldownSeconds: 10 },
    }),
  },
}));

import { aiRateLimiter } from './ai-rate-limiter';

describe('AIRateLimiter', () => {
  const guildId = 'guild-1';
  const userId = 'user-1';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow the first request', () => {
    const g = 'fresh-guild';
    const u = 'fresh-user';
    const result = aiRateLimiter.check(g, u);
    expect(result).toEqual({ allowed: true });
  });

  it('should decrement remaining after consume', () => {
    const g = 'consume-guild';
    const u = 'consume-user';

    const before = aiRateLimiter.getRemainingToday(g, u);
    aiRateLimiter.consume(g, u);
    const after = aiRateLimiter.getRemainingToday(g, u);

    expect(after).toBe(before - 1);
  });

  it('should block when maxRequestsPerDay is reached', () => {
    const g = 'limit-guild';
    const u = 'limit-user';
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 5; i++) {
      vi.spyOn(Date, 'now').mockReturnValue(now + (i + 1) * 11_000);
      aiRateLimiter.consume(g, u);
    }

    vi.spyOn(Date, 'now').mockReturnValue(now + 6 * 11_000);
    const result = aiRateLimiter.check(g, u);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('5');
  });

  it('should block within cooldown period', () => {
    const g = 'cooldown-guild';
    const u = 'cooldown-user';
    const now = 1_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    aiRateLimiter.consume(g, u);

    vi.spyOn(Date, 'now').mockReturnValue(now + 3_000);
    const result = aiRateLimiter.check(g, u);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('сек');
  });

  it('should allow after cooldown expires', () => {
    const g = 'cooldown-expire-guild';
    const u = 'cooldown-expire-user';
    const now = 2_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    aiRateLimiter.consume(g, u);

    vi.spyOn(Date, 'now').mockReturnValue(now + 11_000);
    const result = aiRateLimiter.check(g, u);
    expect(result.allowed).toBe(true);
  });

  it('should reset daily tracker after 24 hours', () => {
    const g = 'reset-guild';
    const u = 'reset-user';
    const now = 3_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 5; i++) {
      vi.spyOn(Date, 'now').mockReturnValue(now + (i + 1) * 11_000);
      aiRateLimiter.consume(g, u);
    }

    vi.spyOn(Date, 'now').mockReturnValue(now + 6 * 11_000);
    expect(aiRateLimiter.check(g, u).allowed).toBe(false);

    const nextDay = now + 11_000 + 24 * 60 * 60 * 1000;
    vi.spyOn(Date, 'now').mockReturnValue(nextDay);

    const result = aiRateLimiter.check(g, u);
    expect(result.allowed).toBe(true);
    expect(aiRateLimiter.getRemainingToday(g, u)).toBe(5);
  });

  it('should track users/guilds independently', () => {
    const now = 4_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    aiRateLimiter.consume('guild-a', 'user-a');

    vi.spyOn(Date, 'now').mockReturnValue(now + 1_000);
    const resultA = aiRateLimiter.check('guild-a', 'user-a');
    const resultB = aiRateLimiter.check('guild-a', 'user-b');
    const resultC = aiRateLimiter.check('guild-b', 'user-a');

    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
    expect(resultC.allowed).toBe(true);
  });
});
