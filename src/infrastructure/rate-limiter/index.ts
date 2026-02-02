import { createLogger } from '../logger';

const logger = createLogger('RateLimiter');

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitState {
  requests: number;
  windowStart: number;
}

export class RateLimiter {
  private state: Map<string, RateLimitState> = new Map();
  private config: Map<string, RateLimitConfig> = new Map();

  register(key: string, maxRequests: number, windowMs: number): void {
    this.config.set(key, { maxRequests, windowMs });
  }

  async acquire(key: string): Promise<boolean> {
    const config = this.config.get(key);
    if (!config) {
      logger.warn(`Rate limiter not configured for: ${key}`);
      return true;
    }

    const now = Date.now();
    let state = this.state.get(key);

    if (!state || now - state.windowStart >= config.windowMs) {
      state = { requests: 0, windowStart: now };
      this.state.set(key, state);
    }

    if (state.requests >= config.maxRequests) {
      const waitTime = config.windowMs - (now - state.windowStart);
      logger.warn(`Rate limit exceeded for ${key}, wait ${waitTime}ms`);
      return false;
    }

    state.requests++;
    return true;
  }

  async acquireOrWait(key: string): Promise<void> {
    const config = this.config.get(key);
    if (!config) return;

    while (!(await this.acquire(key))) {
      const state = this.state.get(key)!;
      const waitTime = config.windowMs - (Date.now() - state.windowStart) + 100;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

export const rateLimiter = new RateLimiter();

rateLimiter.register('monobank', 1, 60000);
rateLimiter.register('coingecko', 10, 60000);
rateLimiter.register('weather', 60, 60000);
rateLimiter.register('translate', 100, 60000);
