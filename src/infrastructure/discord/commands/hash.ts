import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import crypto from 'crypto';

export const hashCommand = new SlashCommandBuilder()
  .setName('hash')
  .setDescription('Хешировать текст')
  .addStringOption(option =>
    option.setName('text')
      .setDescription('Текст для хеширования')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('algorithm')
      .setDescription('Алгоритм хеширования')
      .setRequired(false)
      .addChoices(
        { name: 'MD5', value: 'md5' },
        { name: 'SHA-1', value: 'sha1' },
        { name: 'SHA-256', value: 'sha256' },
        { name: 'SHA-512', value: 'sha512' }
      ));

export async function handleHashCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const text = interaction.options.getString('text', true);
  const algorithm = interaction.options.getString('algorithm') ?? 'sha256';

  const hash = crypto.createHash(algorithm).update(text).digest('hex');

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🔒 Хеширование')
    .addFields(
      { name: '📝 Исходный текст', value: `\`${text.length > 100 ? text.substring(0, 100) + '...' : text}\`` },
      { name: `🔐 ${algorithm.toUpperCase()}`, value: `\`\`\`${hash}\`\`\`` }
    )
    .setFooter({ text: `Длина хеша: ${hash.length} символов` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
