import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const warnCommand = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Выдать предупреждение пользователю')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Причина предупреждения')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function handleWarnCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);
  const reason = interaction.options.getString('reason', true);

  const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: '❌ Пользователь не найден на сервере.', ephemeral: true });
    return;
  }

  if (targetUser.id === interaction.user.id) {
    await interaction.reply({ content: '❌ Нельзя предупредить самого себя.', ephemeral: true });
    return;
  }

  if (targetUser.bot) {
    await interaction.reply({ content: '❌ Нельзя предупредить бота.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xFFFF00)
    .setTitle('⚠️ Предупреждение')
    .addFields(
      { name: '👤 Пользователь', value: `<@${targetUser.id}>`, inline: true },
      { name: '🆔 ID', value: targetUser.id, inline: true },
      { name: '📝 Причина', value: reason },
      { name: '👮 Модератор', value: interaction.user.tag, inline: true }
    )
    .setThumbnail(targetUser.displayAvatarURL())
    .setTimestamp();

  try {
    await targetUser.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFFFF00)
          .setTitle(`⚠️ Вы получили предупреждение на сервере ${interaction.guild?.name}`)
          .addFields(
            { name: '📝 Причина', value: reason },
            { name: '👮 Модератор', value: interaction.user.tag }
          )
          .setTimestamp()
      ]
    });
    embed.setFooter({ text: '📬 Уведомление отправлено в ЛС' });
  } catch {
    embed.setFooter({ text: '📭 Не удалось отправить уведомление в ЛС' });
  }

  await interaction.reply({ embeds: [embed] });
}
