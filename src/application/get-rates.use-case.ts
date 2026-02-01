import { CurrencyProvider } from '../domain/currency/types';
import { formatRates } from '../domain/currency/formatter';

export class GetRatesUseCase {
  constructor(private readonly currencyProvider: CurrencyProvider) {}

  async execute(): Promise<string> {
    const rates = await this.currencyProvider.getRates();
    return formatRates(rates);
  }

  async executeWithGreeting(): Promise<string> {
    const rates = await this.currencyProvider.getRates();
    return `🌅 **Доброе утро!**\n\n${formatRates(rates)}`;
  }
}
