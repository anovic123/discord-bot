import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { logCommandError } from '../utils/error-handler';

export const invitesCommand = new SlashCommandBuilder()
  .setName('invites')
  .setDescription('Показать инвайты пользователя или сервера')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь (если не указан — показать все инвайты)')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function handleInvitesCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const targetUser = interaction.options.getUser('user');

  try {
    const invites = await interaction.guild?.invites.fetch();

    if (!invites || invites.size === 0) {
      await interaction.reply({ content: '❌ На сервере нет активных инвайтов.', ephemeral: true });
      return;
    }

    if (targetUser) {
      const userInvites = invites.filter(i => i.inviter?.id === targetUser.id);

      if (userInvites.size === 0) {
        await interaction.reply({ content: `❌ У ${targetUser.tag} нет активных инвайтов.`, ephemeral: true });
        return;
      }

      const totalUses = userInvites.reduce((acc, inv) => acc + (inv.uses ?? 0), 0);

      const invitesList = userInvites
        .map(i => `\`${i.code}\` — ${i.uses ?? 0} исп. (${i.channel?.name ?? 'неизвестно'})`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📨 Инвайты ${targetUser.tag}`)
        .setDescription(invitesList)
        .addFields(
          { name: '📊 Всего инвайтов', value: `${userInvites.size}`, inline: true },
          { name: '👥 Всего приглашено', value: `${totalUses}`, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      const invitesList = invites
        .sort((a, b) => (b.uses ?? 0) - (a.uses ?? 0))
        .first(15)
        ?.map(i => `\`${i.code}\` — ${i.uses ?? 0} исп. (${i.inviter?.tag ?? 'неизвестно'})`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📨 Инвайты сервера (топ 15)`)
        .setDescription(invitesList ?? 'Нет данных')
        .addFields({ name: '📊 Всего инвайтов', value: `${invites.size}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (error) {
    logCommandError("invites", error);
    await interaction.reply({ content: '❌ Не удалось получить инвайты.', ephemeral: true });
  }
}
