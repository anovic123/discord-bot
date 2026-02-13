import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ChannelType,
  TextChannel,
  VoiceChannel,
} from 'discord.js';

export const channelinfoCommand = new SlashCommandBuilder()
  .setName('channelinfo')
  .setDescription('Информация о канале')
  .addChannelOption((option) =>
    option.setName('channel').setDescription('Канал (по умолчанию текущий)').setRequired(false)
  );

export async function handleChannelinfoCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;

  if (!channel) {
    await interaction.reply({ content: '❌ Канал не найден.', ephemeral: true });
    return;
  }

  const guildChannel = interaction.guild?.channels.cache.get(channel.id);
  if (!guildChannel) {
    await interaction.reply({ content: '❌ Канал не найден на сервере.', ephemeral: true });
    return;
  }

  const channelTypes: Record<number, string> = {
    [ChannelType.GuildText]: '💬 Текстовый',
    [ChannelType.GuildVoice]: '🔊 Голосовой',
    [ChannelType.GuildCategory]: '📁 Категория',
    [ChannelType.GuildAnnouncement]: '📢 Новостной',
    [ChannelType.GuildStageVoice]: '🎭 Сцена',
    [ChannelType.GuildForum]: '📋 Форум',
  };

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📍 Информация о канале: #${guildChannel.name}`)
    .addFields(
      { name: '🆔 ID', value: guildChannel.id, inline: true },
      { name: '📂 Тип', value: channelTypes[guildChannel.type] ?? 'Неизвестно', inline: true },
      {
        name: '📅 Создан',
        value: `<t:${Math.floor(guildChannel.createdTimestamp! / 1000)}:R>`,
        inline: true,
      }
    );

  if (guildChannel.parent) {
    embed.addFields({ name: '📁 Категория', value: guildChannel.parent.name, inline: true });
  }

  if (guildChannel instanceof TextChannel) {
    embed.addFields(
      {
        name: '🐢 Слоумод',
        value:
          guildChannel.rateLimitPerUser > 0 ? `${guildChannel.rateLimitPerUser} сек` : 'Выключен',
        inline: true,
      },
      { name: '🔞 NSFW', value: guildChannel.nsfw ? 'Да' : 'Нет', inline: true }
    );
    if (guildChannel.topic) {
      embed.addFields({ name: '📝 Тема', value: guildChannel.topic });
    }
  }

  if (guildChannel instanceof VoiceChannel) {
    embed.addFields(
      { name: '👥 Участников', value: `${guildChannel.members.size}`, inline: true },
      {
        name: '👤 Лимит',
        value: guildChannel.userLimit > 0 ? `${guildChannel.userLimit}` : 'Нет',
        inline: true,
      },
      { name: '📶 Битрейт', value: `${guildChannel.bitrate / 1000} kbps`, inline: true }
    );
  }

  embed.setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
