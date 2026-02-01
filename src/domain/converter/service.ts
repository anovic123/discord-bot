import { Currency, ConversionResult } from './types';
import { CurrencyRates, CurrencyRate } from '../currency/types';

export class ConverterService {
  private rates: Map<string, { buy: number; sell: number }> = new Map();

  updateRates(currencyRates: CurrencyRates): void {
    this.setRate('USD', currencyRates.usdUah);
    this.setRate('EUR', currencyRates.eurUah);
    this.setRate('PLN', currencyRates.plnUah);
  }

  private setRate(currency: string, rate: CurrencyRate): void {
    if (rate.buy && rate.sell) {
      this.rates.set(currency, { buy: rate.buy, sell: rate.sell });
    } else if (rate.cross) {
      this.rates.set(currency, { buy: rate.cross, sell: rate.cross });
    }
  }

  convert(amount: number, from: Currency, to: Currency): ConversionResult | null {
    if (from === to) {
      return { amount, from, to, result: amount, rate: 1 };
    }

    const rate = this.getRate(from, to);
    if (!rate) return null;

    return {
      amount,
      from,
      to,
      result: amount * rate,
      rate,
    };
  }

  private getRate(from: Currency, to: Currency): number | null {
    if (from === 'UAH') {
      const toRate = this.rates.get(to);
      if (!toRate) return null;
      return 1 / toRate.sell;
    }

    if (to === 'UAH') {
      const fromRate = this.rates.get(from);
      if (!fromRate) return null;
      return fromRate.buy;
    }

    const fromRate = this.rates.get(from);
    const toRate = this.rates.get(to);
    if (!fromRate || !toRate) return null;

    return fromRate.buy / toRate.sell;
  }
}

export function formatConversion(result: ConversionResult): string {
  const amountFormatted = result.amount.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  const resultFormatted = result.result.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  const rateFormatted = result.rate.toFixed(4);

  return [
    `💱 **Конвертация**`,
    '',
    `**${amountFormatted} ${result.from}** = **${resultFormatted} ${result.to}**`,
    '',
    `Курс: 1 ${result.from} = ${rateFormatted} ${result.to}`,
  ].join('\n');
}
