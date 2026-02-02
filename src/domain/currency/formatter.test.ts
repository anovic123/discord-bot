import { describe, it, expect } from 'vitest';
import { formatRates } from './formatter';
import { CurrencyRates } from './types';

describe('formatRates', () => {
  it('should format rates with buy/sell values', () => {
    const rates: CurrencyRates = {
      usdUah: { pair: 'USD/UAH', buy: 41.0, sell: 41.5, cross: null },
      eurUah: { pair: 'EUR/UAH', buy: 44.0, sell: 44.5, cross: null },
      plnUah: { pair: 'PLN/UAH', buy: 10.0, sell: 10.5, cross: null },
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
      usdUah: { pair: 'USD/UAH', buy: 41.0, sell: 41.5, cross: null },
      eurUah: { pair: 'EUR/UAH', buy: 44.0, sell: 44.5, cross: null },
      plnUah: { pair: 'PLN/UAH', buy: null, sell: null, cross: 10.5 },
      updatedAt: new Date('2024-01-15T10:30:00'),
    };

    const result = formatRates(rates);

    expect(result).toContain('Кросс-курс');
    expect(result).toContain('10.50');
  });

  it('should show unavailable message when no data', () => {
    const rates: CurrencyRates = {
      usdUah: { pair: 'USD/UAH', buy: 41.0, sell: 41.5, cross: null },
      eurUah: { pair: 'EUR/UAH', buy: null, sell: null, cross: null },
      plnUah: { pair: 'PLN/UAH', buy: 10.0, sell: 10.5, cross: null },
      updatedAt: new Date('2024-01-15T10:30:00'),
    };

    const result = formatRates(rates);

    expect(result).toContain('Данные недоступны');
  });

  it('should format date and time correctly', () => {
    const rates: CurrencyRates = {
      usdUah: { pair: 'USD/UAH', buy: 41.0, sell: 41.5, cross: null },
      eurUah: { pair: 'EUR/UAH', buy: 44.0, sell: 44.5, cross: null },
      plnUah: { pair: 'PLN/UAH', buy: 10.0, sell: 10.5, cross: null },
      updatedAt: new Date('2024-01-15T10:30:00'),
    };

    const result = formatRates(rates);

    expect(result).toContain('2024');
  });
});
