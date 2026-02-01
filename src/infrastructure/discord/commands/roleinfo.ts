import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const roleinfoCommand = new SlashCommandBuilder()
  .setName('roleinfo')
  .setDescription('Информация о роли')
  .addRoleOption(option =>
    option
      .setName('role')
      .setDescription('Роль')
      .setRequired(true)
  );

export async function handleRoleinfoCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const role = interaction.options.getRole('role', true);
  const guildRole = interaction.guild?.roles.cache.get(role.id);

  if (!guildRole) {
    await interaction.reply({ content: '❌ Роль не найдена.', ephemeral: true });
    return;
  }

  const permissions = guildRole.permissions.toArray();
  const permissionsList = permissions.length > 0
    ? permissions.slice(0, 10).join(', ') + (permissions.length > 10 ? ` и ещё ${permissions.length - 10}...` : '')
    : 'Нет особых прав';

  const embed = new EmbedBuilder()
    .setColor(guildRole.color || 0x5865F2)
    .setTitle(`🎭 Информация о роли: ${guildRole.name}`)
    .addFields(
      { name: '🆔 ID', value: guildRole.id, inline: true },
      { name: '🎨 Цвет', value: guildRole.hexColor, inline: true },
      { name: '📊 Позиция', value: `${guildRole.position}`, inline: true },
      { name: '👥 Участников', value: `${guildRole.members.size}`, inline: true },
      { name: '🔔 Упоминаемая', value: guildRole.mentionable ? 'Да' : 'Нет', inline: true },
      { name: '📌 Отображается отдельно', value: guildRole.hoist ? 'Да' : 'Нет', inline: true },
      { name: '🤖 Управляется интеграцией', value: guildRole.managed ? 'Да' : 'Нет', inline: true },
      { name: '📅 Создана', value: `<t:${Math.floor(guildRole.createdTimestamp / 1000)}:R>`, inline: true },
      { name: '🔐 Права', value: permissionsList }
    )
    .setTimestamp();

  if (guildRole.icon) {
    embed.setThumbnail(guildRole.iconURL() ?? '');
  }

  await interaction.reply({ embeds: [embed] });
}
