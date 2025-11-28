#!/usr/bin/env node
import { logger } from './utils/logger';

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION - Server will continue running:', error);
  logger.error('Stack trace:', error.stack);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('UNHANDLED PROMISE REJECTION - Server will continue running:', reason);
  logger.error('Promise:', promise);
  // Don't exit - keep server running
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

logger.info('Global error handlers initialized');
logger.info('Server starting...');

// Start health check server
import { startHealthCheckServer } from './utils/health-check';
const healthCheckPort = parseInt(process.env.HEALTH_CHECK_PORT || '8080');
startHealthCheckServer(healthCheckPort);

import './transport/udp/server';
