import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const pingCommand = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Проверить задержку бота');

export async function handlePingCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const sent = await interaction.reply({ content: '🏓 Пингую...', fetchReply: true });

  const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
  const wsHeartbeat = interaction.client.ws.ping;

  const embed = new EmbedBuilder()
    .setColor(roundtrip < 200 ? 0x00ff00 : roundtrip < 500 ? 0xffff00 : 0xff0000)
    .setTitle('🏓 Понг!')
    .addFields(
      { name: '⏱️ Задержка', value: `${roundtrip}ms`, inline: true },
      { name: '💓 WebSocket', value: `${wsHeartbeat}ms`, inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ content: null, embeds: [embed] });
}
