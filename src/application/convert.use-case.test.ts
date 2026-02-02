import { describe, it, expect, vi } from 'vitest';
import { ConvertUseCase } from './convert.use-case';
import { CurrencyProvider, CurrencyRates } from '../domain/currency/types';

describe('ConvertUseCase', () => {
  const mockRates: CurrencyRates = {
    usdUah: { pair: 'USD/UAH', buy: 41.0, sell: 41.5, cross: null },
    eurUah: { pair: 'EUR/UAH', buy: 44.0, sell: 44.5, cross: null },
    plnUah: { pair: 'PLN/UAH', buy: null, sell: null, cross: 10.5 },
    updatedAt: new Date(),
  };

  const createMockProvider = (): CurrencyProvider => ({
    getRates: vi.fn().mockResolvedValue(mockRates),
  });

  it('should convert USD to UAH', async () => {
    const provider = createMockProvider();
    const useCase = new ConvertUseCase(provider);

    const result = await useCase.execute(100, 'usd', 'uah');

    expect(provider.getRates).toHaveBeenCalled();
    expect(result).toContain('Конвертация');
    expect(result).toContain('100');
    expect(result).toContain('USD');
    expect(result).toContain('UAH');
  });

  it('should handle case insensitive currency codes', async () => {
    const provider = createMockProvider();
    const useCase = new ConvertUseCase(provider);

    const result = await useCase.execute(50, 'EUR', 'uah');

    expect(result).toContain('EUR');
    expect(result).toContain('UAH');
  });

  it('should return error for invalid source currency', async () => {
    const provider = createMockProvider();
    const useCase = new ConvertUseCase(provider);

    const result = await useCase.execute(100, 'GBP', 'UAH');

    expect(result).toContain('Неизвестная валюта');
    expect(result).toContain('UAH, USD, EUR, PLN');
  });

  it('should return error for invalid target currency', async () => {
    const provider = createMockProvider();
    const useCase = new ConvertUseCase(provider);

    const result = await useCase.execute(100, 'USD', 'RUB');

    expect(result).toContain('Неизвестная валюта');
  });

  it('should convert between same currencies', async () => {
    const provider = createMockProvider();
    const useCase = new ConvertUseCase(provider);

    const result = await useCase.execute(100, 'USD', 'USD');

    expect(result).toContain('100');
    expect(result).toContain('USD');
  });

  it('should fetch rates before conversion', async () => {
    const provider = createMockProvider();
    const useCase = new ConvertUseCase(provider);

    await useCase.execute(100, 'USD', 'UAH');

    expect(provider.getRates).toHaveBeenCalledTimes(1);
  });
});
