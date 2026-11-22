const mongoose = require('mongoose');
const logger = require('../utils/logger');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cryptoalerts';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.warn(`Could not connect to MongoDB at ${uri}: ${error.message}`);

    // If local MongoDB isn't reachable and we are in dev/test, attempt memory server fallback
    if (process.env.NODE_ENV !== 'production') {
      try {
        logger.info('Attempting fallback to in-memory MongoDB for local development/testing...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();
        const conn = await mongoose.connect(memUri);
        logger.info(`Fallback In-Memory MongoDB Connected: ${memUri}`);
        return conn;
      } catch (memError) {
        logger.error(`Failed to initialize in-memory fallback MongoDB: ${memError.message}`);
      }
    }

    logger.error(`MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error(`Error disconnecting MongoDB: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
