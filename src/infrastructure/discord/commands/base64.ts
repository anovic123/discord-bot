import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const base64Command = new SlashCommandBuilder()
  .setName('base64')
  .setDescription('Кодирование/декодирование Base64')
  .addStringOption(option =>
    option
      .setName('action')
      .setDescription('Действие')
      .setRequired(true)
      .addChoices(
        { name: 'Закодировать', value: 'encode' },
        { name: 'Декодировать', value: 'decode' }
      )
  )
  .addStringOption(option =>
    option
      .setName('text')
      .setDescription('Текст')
      .setRequired(true)
  );

export async function handleBase64Command(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const action = interaction.options.getString('action', true);
  const text = interaction.options.getString('text', true);

  let result: string;
  try {
    if (action === 'encode') {
      result = Buffer.from(text, 'utf-8').toString('base64');
    } else {
      result = Buffer.from(text, 'base64').toString('utf-8');
    }
  } catch {
    await interaction.reply({ content: '❌ Ошибка при обработке текста.', ephemeral: true });
    return;
  }

  if (result.length > 1900) {
    await interaction.reply({ content: '❌ Результат слишком длинный.', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(action === 'encode' ? '🔐 Base64 Кодирование' : '🔓 Base64 Декодирование')
    .addFields(
      { name: '📝 Вход', value: `\`\`\`${text.slice(0, 500)}\`\`\`` },
      { name: '📊 Результат', value: `\`\`\`${result.slice(0, 500)}\`\`\`` }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
