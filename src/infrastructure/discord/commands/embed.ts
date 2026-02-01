import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const embedCommand = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('Создать кастомный embed')
  .addStringOption(option =>
    option
      .setName('description')
      .setDescription('Текст сообщения')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('title')
      .setDescription('Заголовок')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('color')
      .setDescription('Цвет (hex без #, например: FF5500)')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('image')
      .setDescription('URL изображения')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('thumbnail')
      .setDescription('URL миниатюры')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('footer')
      .setDescription('Текст внизу')
      .setRequired(false)
  )
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('Канал (по умолчанию текущий)')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function handleEmbedCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const description = interaction.options.getString('description', true);
  const title = interaction.options.getString('title');
  const colorHex = interaction.options.getString('color');
  const image = interaction.options.getString('image');
  const thumbnail = interaction.options.getString('thumbnail');
  const footer = interaction.options.getString('footer');
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;

  if (!(channel instanceof TextChannel)) {
    await interaction.reply({ content: '❌ Выбранный канал не является текстовым.', ephemeral: true });
    return;
  }

  const color = colorHex ? parseInt(colorHex, 16) : 0x5865F2;

  if (isNaN(color)) {
    await interaction.reply({ content: '❌ Неверный формат цвета.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(description)
    .setTimestamp();

  if (title) embed.setTitle(title);
  if (image) embed.setImage(image);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (footer) embed.setFooter({ text: footer });

  try {
    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Embed отправлен в <#${channel.id}>`, ephemeral: true });
  } catch (error) {
    console.error('Failed to send embed:', error);
    await interaction.reply({ content: '❌ Не удалось отправить embed.', ephemeral: true });
  }
}
