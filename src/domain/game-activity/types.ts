export interface GameStats {
  totalMs: number;
  lastPlayed: number;
  sessions: number;
}

export interface UserGameStats {
  gameName: string;
  stats: GameStats;
}

export interface ServerGameStats {
  gameName: string;
  totalMs: number;
  players: number;
}

export interface GameLeaderboardEntry {
  userId: string;
  stats: GameStats;
}

export interface ActiveSession {
  startTime: number;
  gameName: string;
}

export interface UserGameData {
  [gameName: string]: GameStats;
}

export interface GameActivityData {
  [userId: string]: UserGameData;
}

export interface GameActivityRepository {
  load(): GameActivityData;
  save(data: GameActivityData): void;
}
