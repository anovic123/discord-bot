import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../logger', () => ({
  createLogger: () => ({ warn: vi.fn(), info: vi.fn(), debug: vi.fn(), error: vi.fn() }),
}));

import { CooldownManager } from './index';

describe('CooldownManager', () => {
  let manager: CooldownManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    manager = new CooldownManager({ windowMs: 10_000, maxCommands: 3, cooldownMs: 5_000 });
  });

  it('should allow the first command', () => {
    const result = manager.check('user-1', 'ping');
    expect(result).toEqual({ allowed: true });
  });

  it('should allow multiple commands within the limit', () => {
    const now = 100_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    manager.check('user-1', 'ping');

    vi.spyOn(Date, 'now').mockReturnValue(now + 100);
    manager.check('user-1', 'ping');

    vi.spyOn(Date, 'now').mockReturnValue(now + 200);
    const result = manager.check('user-1', 'ping');
    expect(result.allowed).toBe(true);
  });

  it('should block when maxCommands exceeded within cooldown', () => {
    const now = 200_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 3; i++) {
      vi.spyOn(Date, 'now').mockReturnValue(now + i * 100);
      manager.check('user-1', 'ping');
    }

    vi.spyOn(Date, 'now').mockReturnValue(now + 1_000);
    const result = manager.check('user-1', 'ping');
    expect(result.allowed).toBe(false);
    expect(result.remainingMs).toBeGreaterThan(0);
  });

  it('should allow after cooldownMs expires', () => {
    const now = 300_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 3; i++) {
      vi.spyOn(Date, 'now').mockReturnValue(now + i * 100);
      manager.check('user-1', 'ping');
    }

    vi.spyOn(Date, 'now').mockReturnValue(now + 6_000);
    const result = manager.check('user-1', 'ping');
    expect(result.allowed).toBe(true);
  });

  it('should reset window after windowMs', () => {
    const now = 400_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 3; i++) {
      vi.spyOn(Date, 'now').mockReturnValue(now + i * 100);
      manager.check('user-1', 'ping');
    }

    vi.spyOn(Date, 'now').mockReturnValue(now + 11_000);
    const result = manager.check('user-1', 'ping');
    expect(result.allowed).toBe(true);
  });

  it('should cleanup stale entries and keep fresh ones', () => {
    const now = 500_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    manager.check('stale-user', 'cmd');
    manager.check('fresh-user', 'cmd');

    vi.spyOn(Date, 'now').mockReturnValue(now + 25_000);
    manager.check('fresh-user', 'cmd');

    vi.spyOn(Date, 'now').mockReturnValue(now + 25_100);
    manager.cleanup();

    const staleResult = manager.check('stale-user', 'cmd');
    expect(staleResult).toEqual({ allowed: true });

    vi.spyOn(Date, 'now').mockReturnValue(now + 25_200);
    const freshResult = manager.check('fresh-user', 'cmd');
    expect(freshResult.allowed).toBe(true);
  });
});
