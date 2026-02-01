export interface CryptoRate {
  symbol: string;
  name: string;
  priceUsd: number;
  priceUah: number;
  change24h: number;
}

export interface CryptoRates {
  btc: CryptoRate;
  eth: CryptoRate;
  ton: CryptoRate;
  updatedAt: Date;
}

export interface CryptoProvider {
  getRates(): Promise<CryptoRates>;
}
