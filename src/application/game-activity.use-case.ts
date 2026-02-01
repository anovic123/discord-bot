import { GameActivityService } from '../domain/game-activity/service';
import { GameActivityRepository } from '../domain/game-activity/types';
import {
  formatDuration,
  formatActiveSession,
  formatUserGameStats,
  formatServerTopGames,
  formatLeaderboard,
} from '../domain/game-activity/formatter';

export interface UserStatsResult {
  hasData: boolean;
  username: string;
  avatarUrl: string | null;
  activeSession: string | null;
  totalTime: string;
  uniqueGames: number;
  totalSessions: number;
  gamesText: string;
  gamesCount: { shown: number; total: number };
}

export interface TopGamesResult {
  hasData: boolean;
  totalTime: string;
  gamesText: string;
}

export interface LeaderboardResult {
  hasData: boolean;
  gameName: string;
  entriesText: string;
}

export class GameActivityUseCase {
  private service: GameActivityService;
  private repository: GameActivityRepository;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(repository: GameActivityRepository) {
    this.repository = repository;
    const data = repository.load();
    this.service = new GameActivityService(data);
  }

  private scheduleSave(): void {
    if (this.saveTimeout) return;

    this.saveTimeout = setTimeout(() => {
      this.repository.save(this.service.getData());
      this.saveTimeout = null;
    }, 30000);
  }

  startSession(userId: string, gameName: string): void {
    this.service.startSession(userId, gameName);
  }

  endSession(userId: string, gameName: string): void {
    const recorded = this.service.endSession(userId, gameName);
    if (recorded) {
      this.scheduleSave();
    }
  }

  forceSave(): void {
    this.service.endAllSessions();
    this.repository.save(this.service.getData());
  }

  getUserStats(
    userId: string,
    username: string,
    avatarUrl: string | null
  ): UserStatsResult {
    const stats = this.service.getUserStats(userId);
    const activeSession = this.service.getActiveSession(userId);

    if (stats.length === 0 && !activeSession) {
      return {
        hasData: false,
        username,
        avatarUrl,
        activeSession: null,
        totalTime: '',
        uniqueGames: 0,
        totalSessions: 0,
        gamesText: '',
        gamesCount: { shown: 0, total: 0 },
      };
    }

    const totalTime = this.service.calculateTotalTime(stats);
    const totalSessions = this.service.calculateTotalSessions(stats);

    return {
      hasData: true,
      username,
      avatarUrl,
      activeSession: activeSession ? formatActiveSession(activeSession) : null,
      totalTime: formatDuration(totalTime),
      uniqueGames: stats.length,
      totalSessions,
      gamesText: formatUserGameStats(stats, 10),
      gamesCount: { shown: Math.min(10, stats.length), total: stats.length },
    };
  }

  getTopGames(): TopGamesResult {
    const topGames = this.service.getTopGames(10);

    if (topGames.length === 0) {
      return {
        hasData: false,
        totalTime: '',
        gamesText: '',
      };
    }

    const totalTime = topGames.reduce((sum, g) => sum + g.totalMs, 0);

    return {
      hasData: true,
      totalTime: formatDuration(totalTime),
      gamesText: formatServerTopGames(topGames),
    };
  }

  getLeaderboard(
    gameName: string,
    getUserName: (userId: string) => string
  ): LeaderboardResult {
    const leaderboard = this.service.getLeaderboard(gameName, 10);

    if (leaderboard.length === 0) {
      return {
        hasData: false,
        gameName,
        entriesText: '',
      };
    }

    return {
      hasData: true,
      gameName,
      entriesText: formatLeaderboard(leaderboard, getUserName),
    };
  }
}
