import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/permissions';
import { logCommandError } from '../utils/error-handler';

export const stealemojiCommand = new SlashCommandBuilder()
  .setName('stealemoji')
  .setDescription('Добавить эмодзи на сервер по ссылке или из другого сервера')
  .addStringOption(option =>
    option
      .setName('emoji')
      .setDescription('Эмодзи или ссылка на изображение')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('name')
      .setDescription('Название для эмодзи')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions);

export async function handleStealemojiCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const emojiInput = interaction.options.getString('emoji', true);
  const name = interaction.options.getString('name', true);

  if (!/^[a-zA-Z0-9_]+$/.test(name) || name.length < 2 || name.length > 32) {
    await interaction.reply({
      content: '❌ Название эмодзи должно содержать только буквы, цифры и _ (2-32 символа).',
      ephemeral: true
    });
    return;
  }

  let emojiUrl: string;

  const customEmojiMatch = emojiInput.match(/<(a)?:(\w+):(\d+)>/);
  if (customEmojiMatch) {
    const isAnimated = customEmojiMatch[1] === 'a';
    const emojiId = customEmojiMatch[3];
    emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;
  } else if (emojiInput.startsWith('http')) {
    emojiUrl = emojiInput;
  } else {
    await interaction.reply({
      content: '❌ Укажите кастомный эмодзи или прямую ссылку на изображение.',
      ephemeral: true
    });
    return;
  }

  try {
    const emoji = await interaction.guild?.emojis.create({
      attachment: emojiUrl,
      name: name,
    });

    if (!emoji) {
      await interaction.reply({ content: '❌ Не удалось создать эмодзи.', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Эмодзи добавлен')
      .addFields(
        { name: '😀 Эмодзи', value: `${emoji}`, inline: true },
        { name: '📛 Название', value: `:${emoji.name}:`, inline: true },
        { name: '👮 Добавил', value: interaction.user.tag, inline: true }
      )
      .setThumbnail(emoji.url)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError("stealemoji", error);
    await interaction.reply({
      content: '❌ Не удалось добавить эмодзи. Проверьте ссылку и лимиты сервера.',
      ephemeral: true
    });
  }
}
