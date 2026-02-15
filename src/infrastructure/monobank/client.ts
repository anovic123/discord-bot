import axios from 'axios';
import { CurrencyProvider, CurrencyRate, CurrencyRates } from '../../domain/currency/types';
import { rateLimiter } from '../rate-limiter';

const CURRENCY_CODES: Record<string, number> = {
  UAH: 980,
  USD: 840,
  EUR: 978,
  PLN: 985,
  GBP: 826,
  CHF: 756,
  CZK: 203,
  JPY: 392,
  CNY: 156,
  SEK: 752,
  NOK: 578,
  CAD: 124,
  AUD: 36,
  TRY: 949,
  ILS: 376,
  KZT: 398,
  GEL: 981,
};

export const AVAILABLE_CURRENCIES = Object.keys(CURRENCY_CODES).filter((c) => c !== 'UAH');

const DEFAULT_CURRENCIES = ['USD', 'EUR', 'PLN'];

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
  private rawCache: MonobankRate[] | null = null;
  private cacheTime = 0;
  private readonly cacheTtl = 60000;

  async getRates(currencies?: string[]): Promise<CurrencyRates> {
    const now = Date.now();
    if (!this.rawCache || now - this.cacheTime >= this.cacheTtl) {
      await rateLimiter.acquireOrWait('monobank');
      const response = await axios.get<MonobankRate[]>(this.apiUrl);
      this.rawCache = response.data;
      this.cacheTime = now;
    }

    const requested = currencies && currencies.length > 0 ? currencies : DEFAULT_CURRENCIES;
    const uahCode = CURRENCY_CODES.UAH;

    const rates: CurrencyRate[] = requested
      .filter((code) => code in CURRENCY_CODES && code !== 'UAH')
      .map((code) => this.mapRate(this.rawCache!, CURRENCY_CODES[code], uahCode, `${code}/UAH`));

    return { rates, updatedAt: new Date() };
  }

  private mapRate(rates: MonobankRate[], codeA: number, codeB: number, pair: string): CurrencyRate {
    const rate = rates.find((r) => r.currencyCodeA === codeA && r.currencyCodeB === codeB);

    return {
      pair,
      buy: rate?.rateBuy ?? null,
      sell: rate?.rateSell ?? null,
      cross: rate?.rateCross ?? null,
    };
  }
}
