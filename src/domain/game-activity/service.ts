import {
  GameActivityData,
  UserGameStats,
  ServerGameStats,
  GameLeaderboardEntry,
  ActiveSession,
} from './types';

const MIN_SESSION_DURATION_MS = 60000;

export class GameActivityService {
  private data: GameActivityData;
  private activeSessions: Map<string, ActiveSession> = new Map();

  constructor(initialData: GameActivityData = {}) {
    this.data = initialData;
  }

  getData(): GameActivityData {
    return this.data;
  }

  setData(data: GameActivityData): void {
    this.data = data;
  }

  startSession(userId: string, gameName: string): void {
    const key = `${userId}:${gameName}`;

    if (this.activeSessions.has(key)) return;

    this.activeSessions.set(key, {
      startTime: Date.now(),
      gameName,
    });
  }

  endSession(userId: string, gameName: string): boolean {
    const key = `${userId}:${gameName}`;
    const session = this.activeSessions.get(key);

    if (!session) return false;

    const duration = Date.now() - session.startTime;
    this.activeSessions.delete(key);

    if (duration < MIN_SESSION_DURATION_MS) return false;

    this.recordSession(userId, gameName, duration);
    return true;
  }

  private recordSession(userId: string, gameName: string, duration: number): void {
    if (!this.data[userId]) {
      this.data[userId] = {};
    }

    if (!this.data[userId][gameName]) {
      this.data[userId][gameName] = {
        totalMs: 0,
        lastPlayed: 0,
        sessions: 0,
      };
    }

    this.data[userId][gameName].totalMs += duration;
    this.data[userId][gameName].lastPlayed = Date.now();
    this.data[userId][gameName].sessions += 1;
  }

  endAllSessionsForUser(userId: string): void {
    for (const [key, session] of this.activeSessions.entries()) {
      if (key.startsWith(`${userId}:`)) {
        this.endSession(userId, session.gameName);
      }
    }
  }

  endAllSessions(): void {
    for (const [key, session] of this.activeSessions.entries()) {
      const userId = key.split(':')[0];
      this.endSession(userId, session.gameName);
    }
  }

  getUserStats(userId: string): UserGameStats[] {
    const userData = this.data[userId];
    if (!userData) return [];

    return Object.entries(userData)
      .map(([gameName, stats]) => ({ gameName, stats }))
      .sort((a, b) => b.stats.totalMs - a.stats.totalMs);
  }

  getActiveSession(userId: string): ActiveSession | null {
    for (const [key, session] of this.activeSessions.entries()) {
      if (key.startsWith(`${userId}:`)) {
        return session;
      }
    }
    return null;
  }

  getTopGames(limit: number = 10): ServerGameStats[] {
    const gameStats: Map<string, { totalMs: number; players: Set<string> }> = new Map();

    for (const [userId, userData] of Object.entries(this.data)) {
      for (const [gameName, stats] of Object.entries(userData)) {
        if (!gameStats.has(gameName)) {
          gameStats.set(gameName, { totalMs: 0, players: new Set() });
        }
        const game = gameStats.get(gameName)!;
        game.totalMs += stats.totalMs;
        game.players.add(userId);
      }
    }

    return Array.from(gameStats.entries())
      .map(([gameName, data]) => ({
        gameName,
        totalMs: data.totalMs,
        players: data.players.size,
      }))
      .sort((a, b) => b.totalMs - a.totalMs)
      .slice(0, limit);
  }

  getLeaderboard(gameName: string, limit: number = 10): GameLeaderboardEntry[] {
    const leaderboard: GameLeaderboardEntry[] = [];

    for (const [userId, userData] of Object.entries(this.data)) {
      if (userData[gameName]) {
        leaderboard.push({ userId, stats: userData[gameName] });
      }
    }

    return leaderboard
      .sort((a, b) => b.stats.totalMs - a.stats.totalMs)
      .slice(0, limit);
  }

  calculateTotalTime(stats: UserGameStats[]): number {
    return stats.reduce((sum, s) => sum + s.stats.totalMs, 0);
  }

  calculateTotalSessions(stats: UserGameStats[]): number {
    return stats.reduce((sum, s) => sum + s.stats.sessions, 0);
  }
}
