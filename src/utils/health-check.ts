import * as http from 'http';
import { logger } from './logger';

/**
 * Simple HTTP health check server
 * Responds to GET /health with 200 OK if server is running
 */
export function startHealthCheckServer(port: number = 8080) {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }));
    } else if (req.url === '/metrics' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString()
      }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.on('error', (error) => {
    logger.error('Health check server error:', error);
  });

  server.listen(port, () => {
    logger.info(`Health check server listening on port ${port}`);
    logger.info(`Health endpoint: http://localhost:${port}/health`);
    logger.info(`Metrics endpoint: http://localhost:${port}/metrics`);
  });

  return server;
}
