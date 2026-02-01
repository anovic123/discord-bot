import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const setnickCommand = new SlashCommandBuilder()
  .setName('setnick')
  .setDescription('Изменить свой никнейм')
  .addStringOption(option =>
    option
      .setName('nickname')
      .setDescription('Новый никнейм (оставьте пустым для сброса)')
      .setRequired(false)
  );

export async function handleSetnickCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const newNickname = interaction.options.getString('nickname');

  const member = await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: '❌ Не удалось получить данные.', ephemeral: true });
    return;
  }

  const oldNickname = member.nickname ?? member.user.username;

  try {
    await member.setNickname(newNickname);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📝 Никнейм изменён')
      .addFields(
        { name: '📛 Старый', value: oldNickname, inline: true },
        { name: '📛 Новый', value: newNickname ?? '*Сброшен*', inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Failed to change nickname:', error);
    await interaction.reply({ content: '❌ Не удалось изменить никнейм.', ephemeral: true });
  }
}
