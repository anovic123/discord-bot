import { describe, it, expect } from 'vitest';
import { formatCryptoRates } from './formatter';
import { CryptoRates } from './types';

describe('formatCryptoRates', () => {
  const mockRates: CryptoRates = {
    btc: {
      symbol: 'BTC',
      name: 'Bitcoin',
      priceUsd: 45000,
      priceUah: 1845000,
      change24h: 2.5,
    },
    eth: {
      symbol: 'ETH',
      name: 'Ethereum',
      priceUsd: 2500,
      priceUah: 102500,
      change24h: -1.2,
    },
    ton: {
      symbol: 'TON',
      name: 'Toncoin',
      priceUsd: 5.5,
      priceUah: 225.5,
      change24h: 0,
    },
    updatedAt: new Date('2024-01-15T10:30:00'),
  };

  it('should format crypto rates with all currencies', () => {
    const result = formatCryptoRates(mockRates);

    expect(result).toContain('Криптовалюты');
    expect(result).toContain('BTC');
    expect(result).toContain('Bitcoin');
    expect(result).toContain('ETH');
    expect(result).toContain('Ethereum');
    expect(result).toContain('TON');
    expect(result).toContain('Toncoin');
    expect(result).toContain('CoinGecko');
  });

  it('should format positive change with plus sign and up arrow', () => {
    const result = formatCryptoRates(mockRates);

    expect(result).toContain('+2.50%');
    expect(result).toContain('↑');
  });

  it('should format negative change with down arrow', () => {
    const result = formatCryptoRates(mockRates);

    expect(result).toContain('-1.20%');
    expect(result).toContain('↓');
  });

  it('should format prices in USD and UAH', () => {
    const result = formatCryptoRates(mockRates);

    expect(result).toContain('$45,000');
    expect(result).toContain('₴');
  });
});
