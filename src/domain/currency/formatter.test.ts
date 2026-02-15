import { describe, it, expect } from 'vitest';
import { formatRates } from './formatter';
import { CurrencyRates } from './types';

describe('formatRates', () => {
  it('should format rates with buy/sell values', () => {
    const rates: CurrencyRates = {
      rates: [
        { pair: 'USD/UAH', buy: 41.0, sell: 41.5, cross: null },
        { pair: 'EUR/UAH', buy: 44.0, sell: 44.5, cross: null },
        { pair: 'PLN/UAH', buy: 10.0, sell: 10.5, cross: null },
      ],
      updatedAt: new Date('2024-01-15T10:30:00'),
    };

    const result = formatRates(rates);

    expect(result).toContain('Курсы валют');
    expect(result).toContain('USD/UAH');
    expect(result).toContain('EUR/UAH');
    expect(result).toContain('PLN/UAH');
    expect(result).toContain('Покупка');
    expect(result).toContain('Продажа');
    expect(result).toContain('Monobank');
  });

  it('should format rates with cross values', () => {
    const rates: CurrencyRates = {
      rates: [
        { pair: 'USD/UAH', buy: 41.0, sell: 41.5, cross: null },
        { pair: 'EUR/UAH', buy: 44.0, sell: 44.5, cross: null },
        { pair: 'PLN/UAH', buy: null, sell: null, cross: 10.5 },
      ],
      updatedAt: new Date('2024-01-15T10:30:00'),
    };

    const result = formatRates(rates);

    expect(result).toContain('Кросс-курс');
    expect(result).toContain('10.50');
  });

  it('should show unavailable message when no data', () => {
    const rates: CurrencyRates = {
      rates: [
        { pair: 'USD/UAH', buy: 41.0, sell: 41.5, cross: null },
        { pair: 'EUR/UAH', buy: null, sell: null, cross: null },
        { pair: 'PLN/UAH', buy: 10.0, sell: 10.5, cross: null },
      ],
      updatedAt: new Date('2024-01-15T10:30:00'),
    };

    const result = formatRates(rates);

    expect(result).toContain('Данные недоступны');
  });

  it('should format date and time correctly', () => {
    const rates: CurrencyRates = {
      rates: [
        { pair: 'USD/UAH', buy: 41.0, sell: 41.5, cross: null },
      ],
      updatedAt: new Date('2024-01-15T10:30:00'),
    };

    const result = formatRates(rates);

    expect(result).toContain('2024');
  });

  it('should handle empty rates array', () => {
    const rates: CurrencyRates = {
      rates: [],
      updatedAt: new Date('2024-01-15T10:30:00'),
    };

    const result = formatRates(rates);

    expect(result).toContain('Курсы валют');
    expect(result).toContain('Monobank');
  });

  it('should format single currency', () => {
    const rates: CurrencyRates = {
      rates: [
        { pair: 'GBP/UAH', buy: 52.0, sell: 53.0, cross: null },
      ],
      updatedAt: new Date('2024-01-15T10:30:00'),
    };

    const result = formatRates(rates);

    expect(result).toContain('GBP/UAH');
    expect(result).toContain('52.00');
  });
});
