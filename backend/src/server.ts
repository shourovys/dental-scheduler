import app from './app';
import validateEnv from './config/env';
import { disconnectDB } from './database/connection';
import logger from './utils/logger';

const env = validateEnv();
const server = app.listen(env.PORT, () => {
  logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  logger.info(`API Documentation available at http://localhost:${env.PORT}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  // Gracefully shutdown
  gracefulShutdown(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Gracefully shutdown
  gracefulShutdown(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Starting graceful shutdown...');
  gracefulShutdown(0);
});

// Handle SIGINT
process.on('SIGINT', () => {
  logger.info('SIGINT received. Starting graceful shutdown...');
  gracefulShutdown(0);
});

// Graceful shutdown function
async function gracefulShutdown(exitCode: number): Promise<void> {
  try {
    logger.info('Starting graceful shutdown...');

    // Close server
    server.close(() => {
      logger.info('Server closed');
    });

    // Disconnect from database
    await disconnectDB();
    logger.info('Database connections closed');

    // Close any other resources here
    // ...

    // Exit process
    if (env.NODE_ENV === 'production' || exitCode !== 0) {
      logger.info(`Process exiting with code ${exitCode}`);
      process.exit(exitCode);
    }
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}
