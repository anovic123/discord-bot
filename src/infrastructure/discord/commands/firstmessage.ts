import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, EmbedBuilder } from 'discord.js';

export const firstmessageCommand = new SlashCommandBuilder()
  .setName('firstmessage')
  .setDescription('Получить ссылку на первое сообщение в канале')
  .addChannelOption(option =>
    option
      .setName('channel')
      .setDescription('Канал (по умолчанию текущий)')
      .setRequired(false)
  );

export async function handleFirstmessageCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;

  if (!(channel instanceof TextChannel)) {
    await interaction.reply({ content: '❌ Это не текстовый канал.', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    const messages = await channel.messages.fetch({ after: '0', limit: 1 });
    const firstMessage = messages.first();

    if (!firstMessage) {
      await interaction.editReply({ content: '❌ В канале нет сообщений.' });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📜 Первое сообщение')
      .addFields(
        { name: '📍 Канал', value: `<#${channel.id}>`, inline: true },
        { name: '👤 Автор', value: firstMessage.author.tag, inline: true },
        { name: '📅 Дата', value: `<t:${Math.floor(firstMessage.createdTimestamp / 1000)}:F>`, inline: true },
        { name: '🔗 Ссылка', value: `[Перейти к сообщению](${firstMessage.url})` }
      )
      .setTimestamp();

    if (firstMessage.content) {
      const content = firstMessage.content.length > 200
        ? firstMessage.content.slice(0, 200) + '...'
        : firstMessage.content;
      embed.addFields({ name: '💬 Содержимое', value: content });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Failed to fetch first message:', error);
    await interaction.editReply({ content: '❌ Не удалось получить первое сообщение.' });
  }
}
