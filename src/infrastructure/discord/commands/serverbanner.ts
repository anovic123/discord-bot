import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const serverbannerCommand = new SlashCommandBuilder()
  .setName('serverbanner')
  .setDescription('Показать баннер сервера');

export async function handleServerbannerCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guild = interaction.guild;

  if (!guild) {
    await interaction.reply({ content: '❌ Команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const bannerUrl = guild.bannerURL({ size: 4096 });

  if (!bannerUrl) {
    await interaction.reply({ content: '❌ У сервера нет баннера.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`🖼️ Баннер сервера ${guild.name}`)
    .setImage(bannerUrl)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
