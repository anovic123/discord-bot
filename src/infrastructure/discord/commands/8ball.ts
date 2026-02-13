import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

const answers = [
  { text: 'Бесспорно', type: 'positive' },
  { text: 'Предрешено', type: 'positive' },
  { text: 'Никаких сомнений', type: 'positive' },
  { text: 'Определённо да', type: 'positive' },
  { text: 'Можешь быть уверен в этом', type: 'positive' },
  { text: 'Мне кажется — да', type: 'positive' },
  { text: 'Вероятнее всего', type: 'positive' },
  { text: 'Хорошие перспективы', type: 'positive' },
  { text: 'Знаки говорят — да', type: 'positive' },
  { text: 'Да', type: 'positive' },
  { text: 'Пока не ясно, попробуй снова', type: 'neutral' },
  { text: 'Спроси позже', type: 'neutral' },
  { text: 'Лучше не рассказывать', type: 'neutral' },
  { text: 'Сейчас нельзя предсказать', type: 'neutral' },
  { text: 'Сконцентрируйся и спроси опять', type: 'neutral' },
  { text: 'Даже не думай', type: 'negative' },
  { text: 'Мой ответ — нет', type: 'negative' },
  { text: 'По моим данным — нет', type: 'negative' },
  { text: 'Перспективы не очень хорошие', type: 'negative' },
  { text: 'Весьма сомнительно', type: 'negative' },
];

export const eightballCommand = new SlashCommandBuilder()
  .setName('8ball')
  .setDescription('Задать вопрос магическому шару')
  .addStringOption((option) =>
    option.setName('question').setDescription('Ваш вопрос').setRequired(true)
  );

export async function handleEightballCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const question = interaction.options.getString('question', true);
  const answer = answers[Math.floor(Math.random() * answers.length)];

  const color =
    answer.type === 'positive' ? 0x00ff00 : answer.type === 'negative' ? 0xff0000 : 0xffff00;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🎱 Магический шар')
    .addFields({ name: '❓ Вопрос', value: question }, { name: '🔮 Ответ', value: answer.text })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
