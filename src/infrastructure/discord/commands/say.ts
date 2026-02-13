import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const sayCommand = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Отправить сообщение от имени бота')
  .addStringOption((option) =>
    option.setName('message').setDescription('Текст сообщения').setRequired(true)
  )
  .addChannelOption((option) =>
    option.setName('channel').setDescription('Канал (по умолчанию текущий)').setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function handleSayCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const message = interaction.options.getString('message', true);
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;

  if (!(channel instanceof TextChannel)) {
    await interaction.reply({ content: '❌ Канал не является текстовым.', ephemeral: true });
    return;
  }

  try {
    await channel.send(message);
    await interaction.reply({
      content: `✅ Сообщение отправлено в <#${channel.id}>`,
      ephemeral: true,
    });
  } catch (error) {
    logCommandError('say', error);
    await interaction.reply({ content: '❌ Не удалось отправить сообщение.', ephemeral: true });
  }
}
