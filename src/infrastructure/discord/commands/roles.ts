import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const rolesCommand = new SlashCommandBuilder()
  .setName('roles')
  .setDescription('Показать список всех ролей сервера');

export async function handleRolesCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const roles = interaction.guild?.roles.cache
    .filter(r => r.id !== interaction.guild?.id)
    .sort((a, b) => b.position - a.position);

  if (!roles || roles.size === 0) {
    await interaction.reply({ content: '❌ На сервере нет ролей.', ephemeral: true });
    return;
  }

  const rolesList = roles.map(r => `<@&${r.id}> — ${r.members.size} чел.`).join('\n');

  const description = rolesList.length > 4000
    ? rolesList.slice(0, 4000) + '\n...'
    : rolesList;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`🎭 Роли сервера (${roles.size})`)
    .setDescription(description)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
