import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const passwordCommand = new SlashCommandBuilder()
  .setName('password')
  .setDescription('Сгенерировать надёжный пароль')
  .addIntegerOption((option) =>
    option
      .setName('length')
      .setDescription('Длина пароля (8-128)')
      .setRequired(false)
      .setMinValue(8)
      .setMaxValue(128)
  )
  .addBooleanOption((option) =>
    option.setName('symbols').setDescription('Включить символы (!@#$...)').setRequired(false)
  )
  .addBooleanOption((option) =>
    option.setName('numbers').setDescription('Включить цифры').setRequired(false)
  );

export async function handlePasswordCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const length = interaction.options.getInteger('length') ?? 16;
  const includeSymbols = interaction.options.getBoolean('symbols') ?? true;
  const includeNumbers = interaction.options.getBoolean('numbers') ?? true;

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let chars = lowercase + uppercase;
  if (includeNumbers) chars += numbers;
  if (includeSymbols) chars += symbols;

  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const strength =
    length >= 20
      ? 'Очень надёжный'
      : length >= 16
        ? 'Надёжный'
        : length >= 12
          ? 'Средний'
          : 'Слабый';

  const strengthColor =
    length >= 20 ? 0x00ff00 : length >= 16 ? 0x90ee90 : length >= 12 ? 0xffff00 : 0xff0000;

  const embed = new EmbedBuilder()
    .setColor(strengthColor)
    .setTitle('🔐 Генератор паролей')
    .setDescription(`\`\`\`${password}\`\`\``)
    .addFields(
      { name: '📏 Длина', value: `${length}`, inline: true },
      { name: '💪 Надёжность', value: strength, inline: true },
      {
        name: '⚙️ Параметры',
        value: `Символы: ${includeSymbols ? '✅' : '❌'} | Цифры: ${includeNumbers ? '✅' : '❌'}`,
        inline: false,
      }
    )
    .setFooter({ text: 'Сообщение видно только вам' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
