import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js';

export const membersCommand = new SlashCommandBuilder()
  .setName('members')
  .setDescription('Статистика участников сервера');

export async function handleMembersCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply();

  try {
    const members = await interaction.guild?.members.fetch();
    if (!members) {
      await interaction.editReply({ content: '❌ Не удалось получить список участников.' });
      return;
    }

    const total = members.size;
    const bots = members.filter((m: GuildMember) => m.user.bot).size;
    const humans = total - bots;

    const newestMember = members
      .filter((m: GuildMember) => !m.user.bot)
      .sort((a, b) => (b.joinedTimestamp ?? 0) - (a.joinedTimestamp ?? 0))
      .first();

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('👥 Статистика участников')
      .addFields(
        { name: '📊 Всего', value: `${total}`, inline: true },
        { name: '👤 Людей', value: `${humans}`, inline: true },
        { name: '🤖 Ботов', value: `${bots}`, inline: true }
      )
      .setTimestamp();

    if (newestMember) {
      embed.addFields({
        name: '🆕 Новый участник',
        value: `<@${newestMember.id}> — <t:${Math.floor(newestMember.joinedTimestamp! / 1000)}:R>`
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to fetch members:', error);
    await interaction.editReply({ content: '❌ Не удалось получить статистику.' });
  }
}
