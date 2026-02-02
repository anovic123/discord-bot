import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { logCommandError } from '../utils/error-handler';

export const bannerCommand = new SlashCommandBuilder()
  .setName('banner')
  .setDescription('Показать баннер пользователя')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь')
      .setRequired(false)
  );

export async function handleBannerCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const targetUser = interaction.options.getUser('user') ?? interaction.user;

  try {
    const user = await targetUser.fetch(true);
    const bannerUrl = user.bannerURL({ size: 4096 });

    if (!bannerUrl) {
      await interaction.reply({ content: `❌ У ${user.tag} нет баннера.`, ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(user.accentColor ?? 0x5865F2)
      .setTitle(`🖼️ Баннер ${user.tag}`)
      .setImage(bannerUrl)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logCommandError("banner", error);
    await interaction.reply({ content: '❌ Не удалось получить баннер.', ephemeral: true });
  }
}
