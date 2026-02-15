import { CurrencyRate, CurrencyRates } from './types';

function formatRate(rate: CurrencyRate): string {
  if (rate.buy !== null && rate.sell !== null) {
    return `**${rate.pair}**\n  Покупка: ${rate.buy.toFixed(2)} ₴\n  Продажа: ${rate.sell.toFixed(2)} ₴`;
  }

  if (rate.cross !== null) {
    return `**${rate.pair}**\n  Кросс-курс: ${rate.cross.toFixed(2)} ₴`;
  }

  return `**${rate.pair}**\n  Данные недоступны`;
}

export function formatRates(rates: CurrencyRates): string {
  const date = rates.updatedAt.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const time = rates.updatedAt.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines: string[] = [
    `💱 **Курсы валют** (${date}, ${time})`,
    '',
  ];

  for (const rate of rates.rates) {
    lines.push(formatRate(rate));
    lines.push('');
  }

  lines.push('_Источник: Monobank_');

  return lines.join('\n');
}
