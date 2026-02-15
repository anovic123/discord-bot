import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PermissionFlagsBits } from 'discord.js';
import { isAdmin, isAdminCommand, requireAdmin, ADMIN_COMMANDS } from './permissions';

type MockMember = { permissions: { has: ReturnType<typeof vi.fn> } };

function mockMember(isAdministrator: boolean): MockMember {
  return {
    permissions: {
      has: vi.fn((flag: bigint) => {
        if (flag === PermissionFlagsBits.Administrator) return isAdministrator;
        return false;
      }),
    },
  };
}

function mockInteraction(isAdministrator: boolean) {
  const reply = vi.fn();
  return {
    interaction: {
      member: mockMember(isAdministrator),
      reply,
    } as unknown as Parameters<typeof requireAdmin>[0],
    reply,
  };
}

describe('isAdmin', () => {
  it('should return true for member with Administrator permission', () => {
    expect(isAdmin(mockMember(true) as unknown as Parameters<typeof isAdmin>[0])).toBe(true);
  });

  it('should return false for member without Administrator permission', () => {
    expect(isAdmin(mockMember(false) as unknown as Parameters<typeof isAdmin>[0])).toBe(false);
  });

  it('should return false for null member', () => {
    expect(isAdmin(null)).toBe(false);
  });
});

describe('isAdminCommand', () => {
  it('should return true for commands in ADMIN_COMMANDS list', () => {
    expect(isAdminCommand('ban')).toBe(true);
    expect(isAdminCommand('kick')).toBe(true);
    expect(isAdminCommand('settings')).toBe(true);
    expect(isAdminCommand('toxic-mode')).toBe(true);
  });

  it('should return false for user commands', () => {
    expect(isAdminCommand('ping')).toBe(false);
    expect(isAdminCommand('help')).toBe(false);
    expect(isAdminCommand('currency')).toBe(false);
    expect(isAdminCommand('8ball')).toBe(false);
  });
});

describe('requireAdmin', () => {
  it('should return true and not reply for admin user', async () => {
    const { interaction, reply } = mockInteraction(true);

    const result = await requireAdmin(interaction);

    expect(result).toBe(true);
    expect(reply).not.toHaveBeenCalled();
  });

  it('should return false and send ephemeral error for non-admin user', async () => {
    const { interaction, reply } = mockInteraction(false);

    const result = await requireAdmin(interaction);

    expect(result).toBe(false);
    expect(reply).toHaveBeenCalledWith({
      content: '❌ Эта команда доступна только администраторам.',
      ephemeral: true,
    });
  });

  it('should return false when member is null (DM context)', async () => {
    const reply = vi.fn();
    const interaction = { member: null, reply } as unknown as Parameters<typeof requireAdmin>[0];

    const result = await requireAdmin(interaction);

    expect(result).toBe(false);
    expect(reply).toHaveBeenCalled();
  });
});

const COMMANDS_DIR = path.resolve(__dirname, '../commands');

describe('Admin command handlers use requireAdmin', () => {
  const commandFiles = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

  for (const cmd of ADMIN_COMMANDS) {
    it(`${cmd} handler should call requireAdmin`, () => {
      const fileName = `${cmd}.ts`;
      const filePath = path.join(COMMANDS_DIR, fileName);

      expect(
        commandFiles.includes(fileName),
        `Command file ${fileName} should exist`,
      ).toBe(true);

      const source = fs.readFileSync(filePath, 'utf-8');
      expect(
        source.includes('requireAdmin'),
        `${cmd} handler should call requireAdmin()`,
      ).toBe(true);
    });
  }
});

describe('Non-admin command handlers should NOT call requireAdmin', () => {
  const commandFiles = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

  const adminSet = new Set<string>(ADMIN_COMMANDS);

  const userCommands = commandFiles
    .map((f) => f.replace('.ts', ''))
    .filter((name) => !adminSet.has(name));

  for (const cmd of userCommands) {
    it(`${cmd} should not use requireAdmin`, () => {
      const source = fs.readFileSync(path.join(COMMANDS_DIR, `${cmd}.ts`), 'utf-8');
      expect(
        source.includes('requireAdmin'),
        `${cmd} should not call requireAdmin — it's not an admin command`,
      ).toBe(false);
    });
  }
});

describe('Admin commands with setDefaultMemberPermissions', () => {
  const commandsWithDiscordPerms = ADMIN_COMMANDS.filter((cmd) => {
    const filePath = path.join(COMMANDS_DIR, `${cmd}.ts`);
    if (!fs.existsSync(filePath)) return false;
    const source = fs.readFileSync(filePath, 'utf-8');
    return source.includes('setDefaultMemberPermissions');
  });

  const commandsWithoutDiscordPerms = ADMIN_COMMANDS.filter((cmd) => {
    const filePath = path.join(COMMANDS_DIR, `${cmd}.ts`);
    if (!fs.existsSync(filePath)) return false;
    const source = fs.readFileSync(filePath, 'utf-8');
    return !source.includes('setDefaultMemberPermissions');
  });

  it('most admin commands should have setDefaultMemberPermissions', () => {
    expect(commandsWithDiscordPerms.length).toBeGreaterThan(0);
  });

  it('commands without Discord-level perms should still have requireAdmin', () => {
    for (const cmd of commandsWithoutDiscordPerms) {
      const source = fs.readFileSync(path.join(COMMANDS_DIR, `${cmd}.ts`), 'utf-8');
      expect(
        source.includes('requireAdmin'),
        `${cmd} has no setDefaultMemberPermissions, so it must use requireAdmin`,
      ).toBe(true);
    }
  });
});
