import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ChannelType,
} from 'discord.js';
import { logCommandError } from '../utils/error-handler';

export const serverInfoCommand = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Показать информацию о сервере');

export async function handleServerInfoCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guild = interaction.guild;

  if (!guild) {
    await interaction.reply({
      content: '❌ Эта команда доступна только на сервере.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    await guild.fetch();

    const owner = await guild.fetchOwner();
    const channels = guild.channels.cache;
    const textChannels = channels.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = channels.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categories = channels.filter((c) => c.type === ChannelType.GuildCategory).size;

    const roles = guild.roles.cache.size - 1;
    const emojis = guild.emojis.cache.size;
    const stickers = guild.stickers.cache.size;

    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount ?? 0;

    const createdAt = guild.createdAt;
    const createdTimestamp = Math.floor(createdAt.getTime() / 1000);

    const verificationLevels: Record<number, string> = {
      0: 'Нет',
      1: 'Низкий',
      2: 'Средний',
      3: 'Высокий',
      4: 'Очень высокий',
    };

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }) ?? null)
      .addFields(
        {
          name: '👑 Владелец',
          value: owner.user.tag,
          inline: true,
        },
        {
          name: '👥 Участников',
          value: guild.memberCount.toLocaleString('ru-RU'),
          inline: true,
        },
        {
          name: '🎭 Ролей',
          value: roles.toString(),
          inline: true,
        },
        {
          name: '💬 Каналы',
          value: `📝 Текстовых: ${textChannels}\n🔊 Голосовых: ${voiceChannels}\n📁 Категорий: ${categories}`,
          inline: true,
        },
        {
          name: '😀 Эмодзи',
          value: `${emojis} эмодзи\n${stickers} стикеров`,
          inline: true,
        },
        {
          name: '🚀 Бусты',
          value: `Уровень: ${boostLevel}\nБустов: ${boostCount}`,
          inline: true,
        },
        {
          name: '🛡️ Верификация',
          value: verificationLevels[guild.verificationLevel] ?? 'Неизвестно',
          inline: true,
        },
        {
          name: '📅 Создан',
          value: `<t:${createdTimestamp}:D>\n(<t:${createdTimestamp}:R>)`,
          inline: true,
        },
        {
          name: '🆔 ID сервера',
          value: guild.id,
          inline: true,
        }
      )
      .setFooter({ text: `Запрос от ${interaction.user.tag}` })
      .setTimestamp();

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 512 }));
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logCommandError('serverinfo', error);
    await interaction.editReply('❌ Не удалось получить информацию о сервере.');
  }
}
