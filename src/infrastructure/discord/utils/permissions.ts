import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember } from 'discord.js';

export const ADMIN_COMMANDS: readonly string[] = [
  // Баны и модерация
  'ban',
  'unban',
  'banlist',
  'kick',
  'timeout',
  'untimeout',
  'warn',

  // Управление сообщениями
  'clear',
  'purge',

  // Управление каналами
  'lock',
  'unlock',
  'hide',
  'show',
  'slowmode',
  'slowoff',

  // Управление пользователями
  'nick',
  'nickname',
  'role',
  'dm',

  // Голосовые каналы
  'moveall',
  'voicekick',
  'voicemute',
  'voiceunmute',
  'deafen',
  'undeafen',

  // Контент
  'announce',
  'say',
  'embed',
  'stealemoji',
] as const;


export function isAdminCommand(commandName: string): boolean {
  return ADMIN_COMMANDS.includes(commandName);
}

export function isAdmin(member: GuildMember | null): boolean {
  if (!member) return false;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

export async function requireAdmin(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const member = interaction.member as GuildMember | null;

  if (!isAdmin(member)) {
    await interaction.reply({
      content: '❌ Эта команда доступна только администраторам.',
      ephemeral: true
    });
    return false;
  }

  return true;
}
