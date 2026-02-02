import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const dmCommand = new SlashCommandBuilder()
  .setName('dm')
  .setDescription('Отправить личное сообщение пользователю')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('message')
      .setDescription('Текст сообщения')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function handleDmCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const targetUser = interaction.options.getUser('user', true);
  const message = interaction.options.getString('message', true);

  if (targetUser.bot) {
    await interaction.reply({ content: '❌ Нельзя отправить ЛС боту.', ephemeral: true });
    return;
  }

  try {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📨 Сообщение от сервера ${interaction.guild?.name}`)
      .setDescription(message)
      .setFooter({ text: `Отправил: ${interaction.user.tag}` })
      .setTimestamp();

    await targetUser.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Сообщение отправлено ${targetUser.tag}`, ephemeral: true });
  } catch (error) {
    logCommandError("dm", error);
    await interaction.reply({ content: '❌ Не удалось отправить ЛС. Возможно, у пользователя закрыты ЛС.', ephemeral: true });
  }
}
