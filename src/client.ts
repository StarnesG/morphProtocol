#!/usr/bin/env node
import { startUdpClient } from './transport/udp/client';
import { logger } from './utils/logger';

const remoteAddress = process.argv[2];

if (!remoteAddress) {
  logger.error('Usage: node client.js <remote_address:port:userId>');
  logger.error('Example: node client.js 192.168.1.100:12301:user123');
  process.exit(1);
}

startUdpClient(remoteAddress)
  .then((clientPort) => {
    logger.info(`UDP client started successfully on port ${clientPort}`);
  })
  .catch((error) => {
    logger.error('Failed to start UDP client:', error);
    process.exit(1);
  });
