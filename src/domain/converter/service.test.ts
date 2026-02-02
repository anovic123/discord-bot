import { describe, it, expect, beforeEach } from 'vitest';
import { ConverterService, formatConversion } from './service';
import { CurrencyRates } from '../currency/types';

describe('ConverterService', () => {
  let service: ConverterService;

  const mockRates: CurrencyRates = {
    usdUah: { pair: 'USD/UAH', buy: 41.0, sell: 41.5, cross: null },
    eurUah: { pair: 'EUR/UAH', buy: 44.0, sell: 44.5, cross: null },
    plnUah: { pair: 'PLN/UAH', buy: null, sell: null, cross: 10.5 },
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = new ConverterService();
    service.updateRates(mockRates);
  });

  describe('updateRates', () => {
    it('should set rates with buy/sell values', () => {
      const result = service.convert(100, 'USD', 'UAH');
      expect(result).not.toBeNull();
      expect(result!.rate).toBe(41.0);
    });

    it('should set rates with cross value when buy/sell are null', () => {
      const result = service.convert(100, 'PLN', 'UAH');
      expect(result).not.toBeNull();
      expect(result!.rate).toBe(10.5);
    });
  });

  describe('convert', () => {
    it('should return same amount when converting to same currency', () => {
      const result = service.convert(100, 'USD', 'USD');
      expect(result).toEqual({
        amount: 100,
        from: 'USD',
        to: 'USD',
        result: 100,
        rate: 1,
      });
    });

    it('should convert USD to UAH using buy rate', () => {
      const result = service.convert(100, 'USD', 'UAH');
      expect(result).not.toBeNull();
      expect(result!.result).toBe(4100);
      expect(result!.rate).toBe(41.0);
    });

    it('should convert UAH to USD using sell rate', () => {
      const result = service.convert(100, 'UAH', 'USD');
      expect(result).not.toBeNull();
      expect(result!.rate).toBeCloseTo(1 / 41.5, 5);
      expect(result!.result).toBeCloseTo(100 / 41.5, 2);
    });

    it('should convert USD to EUR using cross rate', () => {
      const result = service.convert(100, 'USD', 'EUR');
      expect(result).not.toBeNull();
      expect(result!.rate).toBeCloseTo(41.0 / 44.5, 5);
    });

    it('should convert EUR to USD using cross rate', () => {
      const result = service.convert(100, 'EUR', 'USD');
      expect(result).not.toBeNull();
      expect(result!.rate).toBeCloseTo(44.0 / 41.5, 5);
    });

    it('should return null for unknown currency', () => {
      const emptyService = new ConverterService();
      const result = emptyService.convert(100, 'USD', 'UAH');
      expect(result).toBeNull();
    });

    it('should handle PLN to UAH conversion with cross rate', () => {
      const result = service.convert(100, 'PLN', 'UAH');
      expect(result).not.toBeNull();
      expect(result!.result).toBe(1050);
    });

    it('should handle UAH to PLN conversion with cross rate', () => {
      const result = service.convert(100, 'UAH', 'PLN');
      expect(result).not.toBeNull();
      expect(result!.rate).toBeCloseTo(1 / 10.5, 5);
    });

    it('should handle USD to PLN conversion', () => {
      const result = service.convert(100, 'USD', 'PLN');
      expect(result).not.toBeNull();
      expect(result!.rate).toBeCloseTo(41.0 / 10.5, 5);
    });
  });
});

describe('formatConversion', () => {
  it('should format conversion result correctly', () => {
    const result = formatConversion({
      amount: 100,
      from: 'USD',
      to: 'UAH',
      result: 4100,
      rate: 41.0,
    });

    expect(result).toContain('Конвертация');
    expect(result).toContain('100');
    expect(result).toContain('USD');
    expect(result).toContain('UAH');
    expect(result).toContain('41.0000');
  });

  it('should format large numbers with locale', () => {
    const result = formatConversion({
      amount: 1000000,
      from: 'UAH',
      to: 'USD',
      result: 24096.39,
      rate: 0.02409639,
    });

    expect(result).toContain('UAH');
    expect(result).toContain('USD');
  });

  it('should format rate with 4 decimal places', () => {
    const result = formatConversion({
      amount: 50,
      from: 'EUR',
      to: 'USD',
      result: 53.012,
      rate: 1.06024,
    });

    expect(result).toContain('1.0602');
  });
});
