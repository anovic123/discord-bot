import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const servericonCommand = new SlashCommandBuilder()
  .setName('servericon')
  .setDescription('Показать иконку сервера');

export async function handleServericonCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guild = interaction.guild;

  if (!guild) {
    await interaction.reply({ content: '❌ Команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const iconUrl = guild.iconURL({ size: 4096 });

  if (!iconUrl) {
    await interaction.reply({ content: '❌ У сервера нет иконки.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🖼️ Иконка сервера ${guild.name}`)
    .setImage(iconUrl)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
