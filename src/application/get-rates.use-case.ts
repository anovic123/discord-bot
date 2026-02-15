import { CurrencyProvider } from '../domain/currency/types';
import { formatRates } from '../domain/currency/formatter';

export class GetRatesUseCase {
  constructor(private readonly currencyProvider: CurrencyProvider) {}

  async execute(currencies?: string[]): Promise<string> {
    const rates = await this.currencyProvider.getRates(currencies);
    return formatRates(rates);
  }

  async executeWithGreeting(currencies?: string[]): Promise<string> {
    const rates = await this.currencyProvider.getRates(currencies);
    return `🌅 **Доброе утро!**\n\n${formatRates(rates)}`;
  }
}
