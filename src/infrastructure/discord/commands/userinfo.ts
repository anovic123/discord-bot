import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js';
import { logCommandError } from '../utils/error-handler';

export const userInfoCommand = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Показать информацию о пользователе')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь (по умолчанию — вы)')
      .setRequired(false)
  );

export async function handleUserInfoCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply();

  try {
    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    const member = interaction.guild?.members.cache.get(targetUser.id)
      ?? await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

    const createdTimestamp = Math.floor(targetUser.createdAt.getTime() / 1000);

    const embed = new EmbedBuilder()
      .setColor(member?.displayColor || 0x5865F2)
      .setTitle(targetUser.tag)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: '🆔 ID',
          value: targetUser.id,
          inline: true
        },
        {
          name: '🤖 Бот',
          value: targetUser.bot ? 'Да' : 'Нет',
          inline: true
        },
        {
          name: '📅 Аккаунт создан',
          value: `<t:${createdTimestamp}:D>\n(<t:${createdTimestamp}:R>)`,
          inline: true
        }
      );

    if (member instanceof GuildMember) {
      const joinedTimestamp = member.joinedAt
        ? Math.floor(member.joinedAt.getTime() / 1000)
        : null;

      if (joinedTimestamp) {
        embed.addFields({
          name: '📥 Присоединился к серверу',
          value: `<t:${joinedTimestamp}:D>\n(<t:${joinedTimestamp}:R>)`,
          inline: true,
        });
      }

      if (member.nickname) {
        embed.addFields({
          name: '📝 Никнейм',
          value: member.nickname,
          inline: true,
        });
      }

      const roles = member.roles.cache
        .filter(role => role.id !== interaction.guild?.id)
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString());

      if (roles.length > 0) {
        const rolesDisplay = roles.length > 10
          ? [...roles.slice(0, 10), `+${roles.length - 10} других`].join(', ')
          : roles.join(', ');

        embed.addFields({
          name: `🎭 Роли (${roles.length})`,
          value: rolesDisplay,
          inline: false,
        });
      }

      const permissions = member.permissions;
      const keyPerms: string[] = [];

      if (permissions.has('Administrator')) keyPerms.push('Администратор');
      else {
        if (permissions.has('ManageGuild')) keyPerms.push('Управление сервером');
        if (permissions.has('ManageChannels')) keyPerms.push('Управление каналами');
        if (permissions.has('ManageRoles')) keyPerms.push('Управление ролями');
        if (permissions.has('ManageMessages')) keyPerms.push('Управление сообщениями');
        if (permissions.has('KickMembers')) keyPerms.push('Кик участников');
        if (permissions.has('BanMembers')) keyPerms.push('Бан участников');
        if (permissions.has('ModerateMembers')) keyPerms.push('Тайм-аут участников');
      }

      if (keyPerms.length > 0) {
        embed.addFields({
          name: '🔑 Ключевые права',
          value: keyPerms.join(', '),
          inline: false,
        });
      }

      if (member.premiumSince) {
        const boostTimestamp = Math.floor(member.premiumSince.getTime() / 1000);
        embed.addFields({
          name: '🚀 Бустит сервер',
          value: `С <t:${boostTimestamp}:D>`,
          inline: true,
        });
      }
    }

    embed
      .setFooter({ text: `Запрос от ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logCommandError("userinfo", error);
    await interaction.editReply('❌ Не удалось получить информацию о пользователе.');
  }
}
