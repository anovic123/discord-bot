export interface CurrencyRate {
  pair: string;
  buy: number | null;
  sell: number | null;
  cross: number | null;
}

export interface CurrencyRates {
  usdUah: CurrencyRate;
  eurUah: CurrencyRate;
  plnUah: CurrencyRate;
  updatedAt: Date;
}

export interface CurrencyProvider {
  getRates(): Promise<CurrencyRates>;
}
