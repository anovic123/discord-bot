import * as fs from 'fs';
import * as path from 'path';
import { GameActivityRepository, GameActivityData } from '../../domain/game-activity/types';

export class JsonGameActivityRepository implements GameActivityRepository {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(process.cwd(), 'game-activity.json');
  }

  load(): GameActivityData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        console.log('Game activity data loaded');
        return JSON.parse(raw);
      }
    } catch (error) {
      console.error('Failed to load game activity data:', error);
    }
    return {};
  }

  save(data: GameActivityData): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save game activity data:', error);
    }
  }
}
