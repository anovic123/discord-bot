import { CurrencyProvider } from '../domain/currency/types';
import { ConverterService, formatConversion } from '../domain/converter/service';
import { Currency } from '../domain/converter/types';

const VALID_CURRENCIES: Currency[] = ['UAH', 'USD', 'EUR', 'PLN'];

export class ConvertUseCase {
  private converter = new ConverterService();

  constructor(private readonly currencyProvider: CurrencyProvider) {}

  async execute(amount: number, from: string, to: string): Promise<string> {
    const fromUpper = from.toUpperCase() as Currency;
    const toUpper = to.toUpperCase() as Currency;

    if (!VALID_CURRENCIES.includes(fromUpper) || !VALID_CURRENCIES.includes(toUpper)) {
      return `❌ Неизвестная валюта. Доступны: ${VALID_CURRENCIES.join(', ')}`;
    }

    const rates = await this.currencyProvider.getRates();
    this.converter.updateRates(rates);

    const result = this.converter.convert(amount, fromUpper, toUpper);

    if (!result) {
      return '❌ Не удалось выполнить конвертацию';
    }

    return formatConversion(result);
  }
}
