import { CryptoRate, CryptoRates } from './types';

function formatChange(change: number): string {
  const arrow = change >= 0 ? '↑' : '↓';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}% ${arrow}`;
}

function formatCryptoRate(rate: CryptoRate): string {
  const usdFormatted = rate.priceUsd.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const uahFormatted = rate.priceUah.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

  return [
    `**${rate.symbol}** (${rate.name})`,
    `  $${usdFormatted} | ${uahFormatted} ₴`,
    `  24ч: ${formatChange(rate.change24h)}`,
  ].join('\n');
}

export function formatCryptoRates(rates: CryptoRates): string {
  const time = rates.updatedAt.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return [
    `🪙 **Криптовалюты** (${time})`,
    '',
    formatCryptoRate(rates.btc),
    '',
    formatCryptoRate(rates.eth),
    '',
    formatCryptoRate(rates.ton),
    '',
    '_Источник: CoinGecko_',
  ].join('\n');
}
