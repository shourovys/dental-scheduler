import mongoose from 'mongoose';
import validateEnv from '../config/env';
import logger from '../utils/logger';

const env = validateEnv();

const options: mongoose.ConnectOptions = {
  autoIndex: true, // Build indexes
  minPoolSize: 10, // Maintain up to x socket connections
  maxPoolSize: 50, // Maintain up to x socket connections
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

// Connection ready state
let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    logger.info('MongoDB is already connected');
    return;
  }

  try {
    const connection = await mongoose.connect(env.MONGODB_URI, options);

    isConnected = connection.connection.readyState === 1;
    logger.info('MongoDB connected successfully');

    // Log when MongoDB emits events
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

// Export the mongoose instance for use in models
export const db = mongoose;
