import axios from 'axios';
import { CryptoProvider, CryptoRates } from '../../domain/crypto/types';
import { rateLimiter } from '../rate-limiter';

interface CoinGeckoPrice {
  usd: number;
  uah: number;
  usd_24h_change: number;
}

interface CoinGeckoResponse {
  bitcoin: CoinGeckoPrice;
  ethereum: CoinGeckoPrice;
  'the-open-network': CoinGeckoPrice;
}

export class CoinGeckoClient implements CryptoProvider {
  private readonly apiUrl = 'https://api.coingecko.com/api/v3/simple/price';
  private cache: CryptoRates | null = null;
  private cacheTime = 0;
  private readonly cacheTtl = 30000;

  async getRates(): Promise<CryptoRates> {
    const now = Date.now();
    if (this.cache && now - this.cacheTime < this.cacheTtl) {
      return this.cache;
    }

    await rateLimiter.acquireOrWait('coingecko');

    const response = await axios.get<CoinGeckoResponse>(this.apiUrl, {
      params: {
        ids: 'bitcoin,ethereum,the-open-network',
        vs_currencies: 'usd,uah',
        include_24hr_change: true,
      },
    });

    const data = response.data;

    this.cache = {
      btc: {
        symbol: 'BTC',
        name: 'Bitcoin',
        priceUsd: data.bitcoin.usd,
        priceUah: data.bitcoin.uah,
        change24h: data.bitcoin.usd_24h_change,
      },
      eth: {
        symbol: 'ETH',
        name: 'Ethereum',
        priceUsd: data.ethereum.usd,
        priceUah: data.ethereum.uah,
        change24h: data.ethereum.usd_24h_change,
      },
      ton: {
        symbol: 'TON',
        name: 'Toncoin',
        priceUsd: data['the-open-network'].usd,
        priceUah: data['the-open-network'].uah,
        change24h: data['the-open-network'].usd_24h_change,
      },
      updatedAt: new Date(),
    };
    this.cacheTime = now;

    return this.cache;
  }
}
