export interface CurrencyRate {
  pair: string;
  buy: number | null;
  sell: number | null;
  cross: number | null;
}

export interface CurrencyRates {
  rates: CurrencyRate[];
  updatedAt: Date;
}

export interface CurrencyProvider {
  getRates(currencies?: string[]): Promise<CurrencyRates>;
}
