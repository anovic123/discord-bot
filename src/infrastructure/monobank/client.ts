import axios from 'axios';
import { CurrencyProvider, CurrencyRates } from '../../domain/currency/types';
import { rateLimiter } from '../rate-limiter';

const CURRENCY_CODES = {
  UAH: 980,
  USD: 840,
  EUR: 978,
  PLN: 985,
} as const;

interface MonobankRate {
  currencyCodeA: number;
  currencyCodeB: number;
  date: number;
  rateBuy?: number;
  rateSell?: number;
  rateCross?: number;
}

export class MonobankClient implements CurrencyProvider {
  private readonly apiUrl = 'https://api.monobank.ua/bank/currency';
  private cache: CurrencyRates | null = null;
  private cacheTime = 0;
  private readonly cacheTtl = 60000;

  async getRates(): Promise<CurrencyRates> {
    const now = Date.now();
    if (this.cache && now - this.cacheTime < this.cacheTtl) {
      return this.cache;
    }

    await rateLimiter.acquireOrWait('monobank');

    const response = await axios.get<MonobankRate[]>(this.apiUrl);
    const rates = response.data;

    this.cache = {
      usdUah: this.mapRate(rates, CURRENCY_CODES.USD, CURRENCY_CODES.UAH, 'USD/UAH'),
      eurUah: this.mapRate(rates, CURRENCY_CODES.EUR, CURRENCY_CODES.UAH, 'EUR/UAH'),
      plnUah: this.mapRate(rates, CURRENCY_CODES.PLN, CURRENCY_CODES.UAH, 'PLN/UAH'),
      updatedAt: new Date(),
    };
    this.cacheTime = now;

    return this.cache;
  }

  private mapRate(rates: MonobankRate[], codeA: number, codeB: number, pair: string) {
    const rate = rates.find((r) => r.currencyCodeA === codeA && r.currencyCodeB === codeB);

    return {
      pair,
      buy: rate?.rateBuy ?? null,
      sell: rate?.rateSell ?? null,
      cross: rate?.rateCross ?? null,
    };
  }
}
