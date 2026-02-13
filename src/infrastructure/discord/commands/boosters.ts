import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const boostersCommand = new SlashCommandBuilder()
  .setName('boosters')
  .setDescription('Показать список бустеров сервера');

export async function handleBoostersCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const boosters = interaction.guild?.members.cache.filter((m) => m.premiumSince);

  if (!boosters || boosters.size === 0) {
    await interaction.reply({ content: '😢 На сервере пока нет бустеров.', ephemeral: true });
    return;
  }

  const boosterList = boosters
    .sort((a, b) => (a.premiumSince?.getTime() ?? 0) - (b.premiumSince?.getTime() ?? 0))
    .map((m) => `<@${m.id}> — с <t:${Math.floor(m.premiumSince!.getTime() / 1000)}:R>`)
    .join('\n');

  const description =
    boosterList.length > 4000 ? boosterList.slice(0, 4000) + '\n...' : boosterList;

  const embed = new EmbedBuilder()
    .setColor(0xf47fff)
    .setTitle(`💎 Бустеры сервера (${boosters.size})`)
    .setDescription(description)
    .addFields(
      { name: '🚀 Уровень буста', value: `${interaction.guild?.premiumTier ?? 0}`, inline: true },
      {
        name: '💎 Всего бустов',
        value: `${interaction.guild?.premiumSubscriptionCount ?? 0}`,
        inline: true,
      }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
