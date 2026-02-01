import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const mathCommand = new SlashCommandBuilder()
  .setName('math')
  .setDescription('Калькулятор')
  .addStringOption(option =>
    option
      .setName('expression')
      .setDescription('Математическое выражение (например: 2+2*2)')
      .setRequired(true)
  );

function safeEval(expression: string): number | null {
  const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
  if (sanitized !== expression.replace(/\s/g, '')) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== 'number' || !isFinite(result)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

export async function handleMathCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const expression = interaction.options.getString('expression', true);
  const result = safeEval(expression);

  if (result === null) {
    await interaction.reply({ content: '❌ Неверное выражение. Используйте только числа и операторы: + - * / % ( )', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🔢 Калькулятор')
    .addFields(
      { name: '📝 Выражение', value: `\`${expression}\``, inline: true },
      { name: '📊 Результат', value: `\`${result}\``, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
