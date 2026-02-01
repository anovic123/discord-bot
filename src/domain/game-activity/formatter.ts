import { UserGameStats, ServerGameStats, GameLeaderboardEntry, ActiveSession } from './types';

export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  if (hours === 0) {
    return `${minutes} мин`;
  }

  return `${hours} ч ${minutes} мин`;
}

export function formatRelativeTime(timestamp: number): string {
  return `<t:${Math.floor(timestamp / 1000)}:R>`;
}

function getMedal(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}.`;
}

export function formatActiveSession(session: ActiveSession): string {
  const currentDuration = Date.now() - session.startTime;
  return `**${session.gameName}**\nУже ${formatDuration(currentDuration)}`;
}

export function formatUserGameStats(stats: UserGameStats[], limit: number = 10): string {
  const topGames = stats.slice(0, limit);

  return topGames
    .map((g, i) => {
      const medal = getMedal(i);
      const lastPlayed = formatRelativeTime(g.stats.lastPlayed);
      return `${medal} **${g.gameName}**\n┗ ${formatDuration(g.stats.totalMs)} • ${g.stats.sessions} сессий • ${lastPlayed}`;
    })
    .join('\n\n');
}

export function formatServerTopGames(games: ServerGameStats[]): string {
  return games
    .map((g, i) => {
      const medal = getMedal(i);
      return `${medal} **${g.gameName}**\n┗ ${formatDuration(g.totalMs)} • ${g.players} игроков`;
    })
    .join('\n\n');
}

export function formatLeaderboard(
  entries: GameLeaderboardEntry[],
  getUserName: (userId: string) => string
): string {
  return entries
    .map((entry, i) => {
      const medal = getMedal(i);
      const username = getUserName(entry.userId);
      return `${medal} **${username}**\n┗ ${formatDuration(entry.stats.totalMs)} • ${entry.stats.sessions} сессий`;
    })
    .join('\n\n');
}
