class StatsTracker {
  private commandsExecuted: number = 0;
  private commandUsage: Map<string, number> = new Map();
  private lastCommandTime: Date | null = null;
  private startTime: Date = new Date();
  private errorsCount: number = 0;

  private dailyCommandsExecuted: number = 0;
  private dailyCommandUsage: Map<string, number> = new Map();
  private dailyErrorsCount: number = 0;
  private dailyUniqueUsers: Set<string> = new Set();

  trackCommand(commandName: string, userId?: string): void {
    this.commandsExecuted++;
    this.lastCommandTime = new Date();
    this.commandUsage.set(commandName, (this.commandUsage.get(commandName) || 0) + 1);

    this.dailyCommandsExecuted++;
    this.dailyCommandUsage.set(commandName, (this.dailyCommandUsage.get(commandName) || 0) + 1);

    if (userId) {
      this.dailyUniqueUsers.add(userId);
    }
  }

  trackError(): void {
    this.errorsCount++;
    this.dailyErrorsCount++;
  }

  getStats() {
    const sortedCommands = [...this.commandUsage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      commandsExecuted: this.commandsExecuted,
      lastCommandTime: this.lastCommandTime,
      startTime: this.startTime,
      errorsCount: this.errorsCount,
      topCommands: sortedCommands,
      uniqueCommands: this.commandUsage.size,
    };
  }

  getDailyStats() {
    const sortedCommands = [...this.dailyCommandUsage.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      commandsExecuted: this.dailyCommandsExecuted,
      errorsCount: this.dailyErrorsCount,
      uniqueUsers: this.dailyUniqueUsers.size,
      topCommands: sortedCommands,
    };
  }

  resetDaily(): void {
    this.dailyCommandsExecuted = 0;
    this.dailyCommandUsage.clear();
    this.dailyErrorsCount = 0;
    this.dailyUniqueUsers.clear();
  }

  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }
}

export const statsTracker = new StatsTracker();
