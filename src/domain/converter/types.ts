export type Currency = 'UAH' | 'USD' | 'EUR' | 'PLN';

export interface ConversionResult {
  amount: number;
  from: Currency;
  to: Currency;
  result: number;
  rate: number;
}

export interface ConversionRates {
  [key: string]: number;
}
