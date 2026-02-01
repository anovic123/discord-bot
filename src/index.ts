import { loadConfig } from './config';
import { MonobankClient } from './infrastructure/monobank/client';
import { CoinGeckoClient } from './infrastructure/coingecko/client';
import { JsonGameActivityRepository } from './infrastructure/game-activity/repository';
import { GetRatesUseCase } from './application/get-rates.use-case';
import { GetCryptoUseCase } from './application/get-crypto.use-case';
import { ConvertUseCase } from './application/convert.use-case';
import { GameActivityUseCase } from './application/game-activity.use-case';
import { DiscordBot } from './infrastructure/discord/bot';

const config = loadConfig();

const monobankClient = new MonobankClient();
const coinGeckoClient = new CoinGeckoClient();
const gameActivityRepository = new JsonGameActivityRepository();

const useCases = {
  getRates: new GetRatesUseCase(monobankClient),
  getCrypto: new GetCryptoUseCase(coinGeckoClient),
  convert: new ConvertUseCase(monobankClient),
  gameActivity: new GameActivityUseCase(gameActivityRepository),
};

const bot = new DiscordBot(config, useCases);

bot.start()
  .then(() => console.log('Connecting to Discord...'))
  .catch((error) => {
    console.error('Connection failed:', error);
    process.exit(1);
  });

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  bot.stop();
  process.exit(0);
});
