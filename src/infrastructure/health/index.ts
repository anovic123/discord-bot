import * as http from 'http';
import { createLogger } from '../logger';

const logger = createLogger('Health');

let isHealthy = true;

export function setHealthy(healthy: boolean): void {
  isHealthy = healthy;
}

export function startHealthServer(port = 3000): http.Server {
  const server = http.createServer((req, res) => {

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('Cache-Control', 'no-store');

    if (req.url === '/health' && req.method === 'GET') {
      const status = isHealthy ? 200 : 503;
      const body = JSON.stringify({
        status: isHealthy ? 'ok' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });

      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(body);
    } else if (req.url === '/ready' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ready' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    logger.info(`Health server started on port ${port}`);
  });

  return server;
}
