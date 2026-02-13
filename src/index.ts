import { loadConfig } from './config';
import { createLogger } from './infrastructure/logger';
import { startHealthServer, setHealthy } from './infrastructure/health';
import { MonobankClient } from './infrastructure/monobank/client';
import { CoinGeckoClient } from './infrastructure/coingecko/client';
import { GetRatesUseCase } from './application/get-rates.use-case';
import { GetCryptoUseCase } from './application/get-crypto.use-case';
import { ConvertUseCase } from './application/convert.use-case';
import { DiscordBot } from './infrastructure/discord/bot';

const logger = createLogger('Main');

const config = loadConfig();
const healthServer = startHealthServer(3000);

const monobankClient = new MonobankClient();
const coinGeckoClient = new CoinGeckoClient();

const useCases = {
  getRates: new GetRatesUseCase(monobankClient),
  getCrypto: new GetCryptoUseCase(coinGeckoClient),
  convert: new ConvertUseCase(monobankClient),
};

const bot = new DiscordBot(config, useCases);

bot
  .start()
  .then(() => logger.info('Connecting to Discord...'))
  .catch((error) => {
    logger.error('Connection failed', error);
    process.exit(1);
  });

process.on('SIGINT', () => {
  logger.info('Shutting down...');
  setHealthy(false);
  bot.stop();
  healthServer.close();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
  process.exit(1);
});
