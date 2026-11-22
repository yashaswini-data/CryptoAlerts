require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { connectRabbitMQ, closeRabbitMQ } = require('./config/rabbitmq');
const { startPriceMonitorJob, stopPriceMonitorJob } = require('./jobs/priceMonitorJob');
const { startConsumer, stopConsumer } = require('./queues/consumer');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Connect to RabbitMQ (or initialize fallback bus)
    await connectRabbitMQ();

    // 3. Start Consumer (in dev / unified mode, enables immediate processing)
    await startConsumer();

    // 4. Start Price Monitor Cron Job
    startPriceMonitorJob();

    // 5. Start HTTP Server
    server = app.listen(PORT, () => {
      logger.info(`==================================================`);
      logger.info(`🚀 CryptoAlerts API Server running on port ${PORT}`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`==================================================`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  stopPriceMonitorJob();
  await stopConsumer();
  await closeRabbitMQ();

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }

  // Force close after 10s if graceful fails
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
