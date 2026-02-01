import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const announceCommand = new SlashCommandBuilder()
  .setName('announce')
  .setDescription('Отправить объявление')
  .addStringOption(option =>
    option
      .setName('message')
      .setDescription('Текст объявления')
      .setRequired(true)
  )
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('Канал для объявления (по умолчанию текущий)')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('title')
      .setDescription('Заголовок объявления')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('color')
      .setDescription('Цвет (hex без #)')
      .setRequired(false)
  )
  .addBooleanOption(option =>
    option
      .setName('mention_everyone')
      .setDescription('Упомянуть @everyone')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function handleAnnounceCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const message = interaction.options.getString('message', true);
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;
  const title = interaction.options.getString('title') ?? '📢 Объявление';
  const colorHex = interaction.options.getString('color');
  const mentionEveryone = interaction.options.getBoolean('mention_everyone') ?? false;

  if (!(channel instanceof TextChannel)) {
    await interaction.reply({ content: '❌ Выбранный канал не является текстовым.', ephemeral: true });
    return;
  }

  const color = colorHex ? parseInt(colorHex, 16) : 0x5865F2;

  if (isNaN(color)) {
    await interaction.reply({ content: '❌ Неверный формат цвета. Используйте hex без # (например: FF5500).', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(message)
    .setFooter({ text: `От: ${interaction.user.tag}` })
    .setTimestamp();

  try {
    const content = mentionEveryone ? '@everyone' : undefined;
    await channel.send({ content, embeds: [embed] });

    await interaction.reply({
      content: `✅ Объявление отправлено в <#${channel.id}>`,
      ephemeral: true
    });
  } catch (error) {
    console.error('Failed to send announcement:', error);
    await interaction.reply({ content: '❌ Не удалось отправить объявление.', ephemeral: true });
  }
}
