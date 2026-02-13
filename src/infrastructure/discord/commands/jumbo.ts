import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const jumboCommand = new SlashCommandBuilder()
  .setName('jumbo')
  .setDescription('Показать эмодзи в большом размере')
  .addStringOption((option) => option.setName('emoji').setDescription('Эмодзи').setRequired(true));

export async function handleJumboCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const emojiInput = interaction.options.getString('emoji', true);

  const customEmojiMatch = emojiInput.match(/<(a)?:(\w+):(\d+)>/);

  if (!customEmojiMatch) {
    await interaction.reply({ content: '❌ Укажите кастомный эмодзи Discord.', ephemeral: true });
    return;
  }

  const isAnimated = customEmojiMatch[1] === 'a';
  const emojiName = customEmojiMatch[2];
  const emojiId = customEmojiMatch[3];
  const extension = isAnimated ? 'gif' : 'png';
  const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}?size=512`;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`😀 ${emojiName}`)
    .setImage(emojiUrl)
    .addFields(
      { name: '🆔 ID', value: emojiId, inline: true },
      { name: '✨ Анимированный', value: isAnimated ? 'Да' : 'Нет', inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
