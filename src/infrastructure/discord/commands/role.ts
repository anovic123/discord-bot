import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const roleCommand = new SlashCommandBuilder()
  .setName('role')
  .setDescription('Добавить или убрать роль у пользователя')
  .addUserOption((option) =>
    option.setName('user').setDescription('Пользователь').setRequired(true)
  )
  .addRoleOption((option) => option.setName('role').setDescription('Роль').setRequired(true))
  .addStringOption((option) =>
    option
      .setName('action')
      .setDescription('Действие')
      .setRequired(true)
      .addChoices({ name: 'Добавить', value: 'add' }, { name: 'Убрать', value: 'remove' })
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export async function handleRoleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);
  const role = interaction.options.getRole('role', true);
  const action = interaction.options.getString('action', true);

  const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: '❌ Пользователь не найден на сервере.', ephemeral: true });
    return;
  }

  const guildRole = interaction.guild?.roles.cache.get(role.id);
  if (!guildRole) {
    await interaction.reply({ content: '❌ Роль не найдена.', ephemeral: true });
    return;
  }

  if (guildRole.managed) {
    await interaction.reply({
      content: '❌ Эта роль управляется интеграцией и не может быть назначена.',
      ephemeral: true,
    });
    return;
  }

  const botMember = interaction.guild?.members.me;
  if (botMember && guildRole.position >= botMember.roles.highest.position) {
    await interaction.reply({
      content: '❌ Не могу управлять этой ролью (она выше моей роли).',
      ephemeral: true,
    });
    return;
  }

  try {
    if (action === 'add') {
      if (member.roles.cache.has(role.id)) {
        await interaction.reply({
          content: '❌ У пользователя уже есть эта роль.',
          ephemeral: true,
        });
        return;
      }
      await member.roles.add(guildRole);
    } else {
      if (!member.roles.cache.has(role.id)) {
        await interaction.reply({ content: '❌ У пользователя нет этой роли.', ephemeral: true });
        return;
      }
      await member.roles.remove(guildRole);
    }

    const embed = new EmbedBuilder()
      .setColor(action === 'add' ? 0x00ff00 : 0xff6600)
      .setTitle(action === 'add' ? '➕ Роль добавлена' : '➖ Роль убрана')
      .addFields(
        { name: '👤 Пользователь', value: targetUser.tag, inline: true },
        { name: '🆔 ID', value: targetUser.id, inline: true },
        { name: '🎭 Роль', value: `<@&${role.id}>`, inline: true },
        { name: '👮 Модератор', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError('role', error);
    await interaction.reply({
      content: '❌ Не удалось изменить роль пользователя.',
      ephemeral: true,
    });
  }
}
