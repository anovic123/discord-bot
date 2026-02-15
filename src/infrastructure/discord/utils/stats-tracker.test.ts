import { describe, it, expect, beforeEach } from 'vitest';
import { StatsTracker } from './stats-tracker';

describe('StatsTracker', () => {
  let tracker: StatsTracker;

  beforeEach(() => {
    tracker = new StatsTracker();
  });

  it('should increment commandsExecuted on trackCommand', () => {
    tracker.trackCommand('ping');
    tracker.trackCommand('help');

    const stats = tracker.getStats();
    expect(stats.commandsExecuted).toBe(2);
  });

  it('should add userId to uniqueUsers when provided', () => {
    tracker.trackCommand('ping', 'user-1');
    tracker.trackCommand('ping', 'user-2');
    tracker.trackCommand('help', 'user-1');

    const daily = tracker.getDailyStats();
    expect(daily.uniqueUsers).toBe(2);
  });

  it('should increment errorsCount on trackError', () => {
    tracker.trackError();
    tracker.trackError();

    const stats = tracker.getStats();
    expect(stats.errorsCount).toBe(2);
  });

  it('should return top-5 sorted commands in getStats', () => {
    const commands = ['a', 'b', 'c', 'd', 'e', 'f'];
    commands.forEach((cmd, i) => {
      for (let j = 0; j <= i; j++) {
        tracker.trackCommand(cmd);
      }
    });

    const stats = tracker.getStats();
    expect(stats.topCommands).toHaveLength(5);
    expect(stats.topCommands[0][0]).toBe('f');
    expect(stats.topCommands[0][1]).toBe(6);
    expect(stats.topCommands[4][0]).toBe('b');
  });

  it('should return daily stats', () => {
    tracker.trackCommand('ping', 'user-1');
    tracker.trackCommand('help', 'user-2');
    tracker.trackError();

    const daily = tracker.getDailyStats();
    expect(daily.commandsExecuted).toBe(2);
    expect(daily.errorsCount).toBe(1);
    expect(daily.uniqueUsers).toBe(2);
    expect(daily.topCommands).toHaveLength(2);
  });

  it('should reset daily data on resetDaily', () => {
    tracker.trackCommand('ping', 'user-1');
    tracker.trackError();
    tracker.resetDaily();

    const daily = tracker.getDailyStats();
    expect(daily.commandsExecuted).toBe(0);
    expect(daily.errorsCount).toBe(0);
    expect(daily.uniqueUsers).toBe(0);
    expect(daily.topCommands).toHaveLength(0);

    const stats = tracker.getStats();
    expect(stats.commandsExecuted).toBe(1);
    expect(stats.errorsCount).toBe(1);
  });

  it('should return uptime from startTime', () => {
    const uptime = tracker.getUptime();
    expect(uptime).toBeGreaterThanOrEqual(0);
    expect(uptime).toBeLessThan(1000);
  });
});
