import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

const POLL_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export const pollCommand = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Создать голосование')
  .addStringOption(option =>
    option
      .setName('question')
      .setDescription('Вопрос для голосования')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('options')
      .setDescription('Варианты ответов через | (например: Да | Нет | Возможно)')
      .setRequired(false)
  );

export async function handlePollCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const question = interaction.options.getString('question', true);
  const optionsString = interaction.options.getString('options');

  let options: string[] = [];
  let emojis: string[] = [];

  if (optionsString) {
    options = optionsString.split('|').map(o => o.trim()).filter(o => o.length > 0);

    if (options.length < 2) {
      await interaction.reply({ content: '❌ Нужно минимум 2 варианта ответа.', ephemeral: true });
      return;
    }

    if (options.length > 10) {
      await interaction.reply({ content: '❌ Максимум 10 вариантов ответа.', ephemeral: true });
      return;
    }

    emojis = POLL_EMOJIS.slice(0, options.length);
  } else {
    emojis = ['👍', '👎'];
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📊 ' + question)
    .setFooter({ text: `Голосование от ${interaction.user.tag}` })
    .setTimestamp();

  if (options.length > 0) {
    const description = options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n\n');
    embed.setDescription(description);
  } else {
    embed.setDescription('👍 — Да\n\n👎 — Нет');
  }

  const message = await interaction.reply({ embeds: [embed], fetchReply: true });

  for (const emoji of emojis) {
    await message.react(emoji);
  }
}
