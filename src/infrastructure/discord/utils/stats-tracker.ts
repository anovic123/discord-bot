class StatsTracker {
  private commandsExecuted: number = 0;
  private commandUsage: Map<string, number> = new Map();
  private lastCommandTime: Date | null = null;
  private startTime: Date = new Date();
  private errorsCount: number = 0;

  trackCommand(commandName: string): void {
    this.commandsExecuted++;
    this.lastCommandTime = new Date();
    this.commandUsage.set(
      commandName,
      (this.commandUsage.get(commandName) || 0) + 1
    );
  }

  trackError(): void {
    this.errorsCount++;
  }

  getStats() {
    const sortedCommands = [...this.commandUsage.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      commandsExecuted: this.commandsExecuted,
      lastCommandTime: this.lastCommandTime,
      startTime: this.startTime,
      errorsCount: this.errorsCount,
      topCommands: sortedCommands,
      uniqueCommands: this.commandUsage.size,
    };
  }

  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }
}

export const statsTracker = new StatsTracker();
