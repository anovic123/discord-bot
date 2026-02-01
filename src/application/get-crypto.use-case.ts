import { CryptoProvider } from '../domain/crypto/types';
import { formatCryptoRates } from '../domain/crypto/formatter';

export class GetCryptoUseCase {
  constructor(private readonly cryptoProvider: CryptoProvider) {}

  async execute(): Promise<string> {
    const rates = await this.cryptoProvider.getRates();
    return formatCryptoRates(rates);
  }
}
