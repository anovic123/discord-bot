import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const clearCommand = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Удалить сообщения из канала')
  .addIntegerOption(option =>
    option
      .setName('amount')
      .setDescription('Количество сообщений (1-100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Удалить только сообщения этого пользователя')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function handleClearCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  if (!(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: '❌ Эта команда работает только в текстовых каналах.', ephemeral: true });
    return;
  }

  const amount = interaction.options.getInteger('amount', true);
  const targetUser = interaction.options.getUser('user');

  await interaction.deferReply({ ephemeral: true });

  try {
    let messages = await interaction.channel.messages.fetch({ limit: amount });

    if (targetUser) {
      messages = messages.filter(msg => msg.author.id === targetUser.id);
    }

    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    messages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);

    const deleted = await interaction.channel.bulkDelete(messages, true);

    const response = targetUser
      ? `✅ Удалено **${deleted.size}** сообщений от ${targetUser.tag}`
      : `✅ Удалено **${deleted.size}** сообщений`;

    await interaction.editReply(response);
  } catch (error) {
    logCommandError("clear", error);
    await interaction.editReply('❌ Не удалось удалить сообщения.');
  }
}
