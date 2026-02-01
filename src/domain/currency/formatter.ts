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

  return [
    `💱 **Курсы валют** (${date}, ${time})`,
    '',
    formatRate(rates.usdUah),
    '',
    formatRate(rates.eurUah),
    '',
    formatRate(rates.plnUah),
    '',
    '_Источник: Monobank_',
  ].join('\n');
}
