import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const emojisCommand = new SlashCommandBuilder()
  .setName('emojis')
  .setDescription('Показать список эмодзи сервера')
  .addIntegerOption((option) =>
    option.setName('page').setDescription('Страница').setRequired(false).setMinValue(1)
  );

export async function handleEmojisCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const page = interaction.options.getInteger('page') ?? 1;
  const perPage = 20;

  const emojis = interaction.guild?.emojis.cache;

  if (!emojis || emojis.size === 0) {
    await interaction.reply({ content: '❌ На сервере нет кастомных эмодзи.', ephemeral: true });
    return;
  }

  const staticEmojis = emojis.filter((e) => !e.animated);
  const animatedEmojis = emojis.filter((e) => e.animated);

  const allEmojis = [...staticEmojis.values(), ...animatedEmojis.values()];
  const totalPages = Math.ceil(allEmojis.length / perPage);
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const pageEmojis = allEmojis.slice(start, end);

  const emojiList = pageEmojis.map((e) => `${e} \`:${e.name}:\``).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`😀 Эмодзи сервера`)
    .setDescription(emojiList)
    .addFields(
      { name: '🖼️ Статичные', value: `${staticEmojis.size}`, inline: true },
      { name: '✨ Анимированные', value: `${animatedEmojis.size}`, inline: true },
      { name: '📊 Всего', value: `${emojis.size}`, inline: true }
    )
    .setFooter({ text: `Страница ${currentPage}/${totalPages}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
