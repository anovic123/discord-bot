import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} from 'discord.js';
import { requireAdmin } from '../utils/permissions';

export const moveallCommand = new SlashCommandBuilder()
  .setName('moveall')
  .setDescription('Переместить всех пользователей из одного голосового канала в другой')
  .addChannelOption((option) =>
    option
      .setName('from')
      .setDescription('Из какого канала')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildVoice)
  )
  .addChannelOption((option) =>
    option
      .setName('to')
      .setDescription('В какой канал')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildVoice)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers);

export async function handleMoveallCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!(await requireAdmin(interaction))) return;

  const fromChannel = interaction.options.getChannel('from', true);
  const toChannel = interaction.options.getChannel('to', true);

  if (fromChannel.type !== ChannelType.GuildVoice || toChannel.type !== ChannelType.GuildVoice) {
    await interaction.reply({ content: '❌ Оба канала должны быть голосовыми.', ephemeral: true });
    return;
  }

  const voiceChannel = interaction.guild?.channels.cache.get(fromChannel.id);
  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    await interaction.reply({ content: '❌ Канал не найден.', ephemeral: true });
    return;
  }

  const members = voiceChannel.members;

  if (members.size === 0) {
    await interaction.reply({ content: '❌ В канале нет пользователей.', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  let moved = 0;
  let failed = 0;

  for (const [, member] of members) {
    try {
      await member.voice.setChannel(toChannel.id);
      moved++;
    } catch {
      failed++;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(moved > 0 ? 0x00ff00 : 0xff0000)
    .setTitle('🔀 Перемещение пользователей')
    .addFields(
      { name: '📤 Из канала', value: `<#${fromChannel.id}>`, inline: true },
      { name: '📥 В канал', value: `<#${toChannel.id}>`, inline: true },
      { name: '✅ Перемещено', value: `${moved}`, inline: true },
      { name: '❌ Ошибок', value: `${failed}`, inline: true },
      { name: '👮 Модератор', value: interaction.user.tag, inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
