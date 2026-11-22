require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const { connectRabbitMQ, closeRabbitMQ } = require('./config/rabbitmq');
const { startConsumer, stopConsumer } = require('./queues/consumer');
const logger = require('./utils/logger');

const startWorker = async () => {
  logger.info('==================================================');
  logger.info('⚙️ Starting CryptoAlerts RabbitMQ Consumer Worker...');
  logger.info('==================================================');

  try {
    // Connect to database
    await connectDB();

    // Connect to RabbitMQ
    await connectRabbitMQ();

    // Start consuming
    await startConsumer();

    logger.info('✅ Worker is running and waiting for notification events. Press CTRL+C to exit.');
  } catch (error) {
    logger.error(`Worker startup failed: ${error.message}`);
    process.exit(1);
  }
};

const shutdownWorker = async (signal) => {
  logger.info(`Received ${signal}. Shutting down worker gracefully...`);
  await stopConsumer();
  await closeRabbitMQ();
  await disconnectDB();
  process.exit(0);
};

process.on('SIGTERM', () => shutdownWorker('SIGTERM'));
process.on('SIGINT', () => shutdownWorker('SIGINT'));

if (require.main === module) {
  startWorker();
}

module.exports = { startWorker };
