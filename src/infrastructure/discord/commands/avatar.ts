import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const avatarCommand = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('Показать аватар пользователя в полном размере')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Пользователь (по умолчанию — вы)')
      .setRequired(false)
  );

export async function handleAvatarCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const targetUser = interaction.options.getUser('user') ?? interaction.user;

  const avatarUrl = targetUser.displayAvatarURL({ size: 4096 });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`Аватар ${targetUser.tag}`)
    .setImage(avatarUrl)
    .addFields({
      name: '🔗 Ссылки',
      value: `[PNG](${targetUser.displayAvatarURL({ size: 4096, extension: 'png' })}) • [JPG](${targetUser.displayAvatarURL({ size: 4096, extension: 'jpg' })}) • [WEBP](${targetUser.displayAvatarURL({ size: 4096, extension: 'webp' })})`,
    })
    .setFooter({ text: `Запрос от ${interaction.user.tag}` })
    .setTimestamp();

  if (targetUser.avatar?.startsWith('a_')) {
    embed.data.fields![0].value += ` • [GIF](${targetUser.displayAvatarURL({ size: 4096, extension: 'gif' })})`;
  }

  await interaction.reply({ embeds: [embed] });
}
