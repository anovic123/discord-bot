import { ChatInputCommandInteraction } from 'discord.js';
import { createLogger } from '../../logger';

const logger = createLogger('Command');

export async function handleCommandError(
  interaction: ChatInputCommandInteraction,
  error: unknown,
  commandName?: string
): Promise<void> {
  const name = commandName || interaction.commandName;
  logger.error(`Command failed: ${name}`, error);

  const message = '❌ Произошла ошибка при выполнении команды';

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: message, ephemeral: true });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  } catch {}
}

export function logCommandError(commandName: string, error: unknown): void {
  logger.error(`Command failed: ${commandName}`, error);
}
