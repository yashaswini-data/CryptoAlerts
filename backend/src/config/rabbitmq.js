const amqp = require('amqplib');
const EventEmitter = require('events');
const logger = require('../utils/logger');

const QUEUE_NAME = process.env.RABBITMQ_QUEUE || 'crypto-alert-notifications';
const DLQ_NAME = process.env.RABBITMQ_DLQ || 'crypto-alert-notifications-dlq';
const EXCHANGE_NAME = process.env.RABBITMQ_EXCHANGE || 'crypto-alerts-exchange';
const DLX_EXCHANGE = 'crypto-alerts-dlx';

let connection = null;
let channel = null;
let isConnecting = false;

// In-process fallback event emitter when standalone dev mode has no RabbitMQ service running
class FallbackBroker extends EventEmitter {
  constructor() {
    super();
    this.isFallback = true;
  }
}
const fallbackBroker = new FallbackBroker();

const connectRabbitMQ = async () => {
  if (channel) return { connection, channel, isFallback: false };
  if (isConnecting) return null;

  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  isConnecting = true;

  try {
    logger.info(`Connecting to RabbitMQ at ${rabbitUrl}...`);
    connection = await amqp.connect(rabbitUrl);

    connection.on('error', (err) => {
      logger.error(`RabbitMQ connection error: ${err.message}`);
      channel = null;
      connection = null;
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed. Reconnecting in 5s...');
      channel = null;
      connection = null;
      setTimeout(connectRabbitMQ, 5000);
    });

    channel = await connection.createChannel();
    await channel.prefetch(1); // Process 1 message at a time per worker

    // Setup Dead Letter Exchange and DLQ
    await channel.assertExchange(DLX_EXCHANGE, 'direct', { durable: true });
    await channel.assertQueue(DLQ_NAME, { durable: true });
    await channel.bindQueue(DLQ_NAME, DLX_EXCHANGE, DLQ_NAME);

    // Setup Main Exchange and Queue with DLX configuration
    await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      deadLetterExchange: DLX_EXCHANGE,
      deadLetterRoutingKey: DLQ_NAME
    });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, QUEUE_NAME);

    logger.info(`RabbitMQ connected. Queues asserted: "${QUEUE_NAME}", DLQ: "${DLQ_NAME}"`);
    isConnecting = false;
    return { connection, channel, isFallback: false };
  } catch (error) {
    isConnecting = false;
    logger.warn(`Could not connect to RabbitMQ broker: ${error.message}`);
    logger.info('Operating with built-in async event broker for local testing/development.');
    return { connection: null, channel: null, isFallback: true };
  }
};

const getChannel = () => channel;
const getFallbackBroker = () => fallbackBroker;

const closeRabbitMQ = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    channel = null;
    connection = null;
    logger.info('RabbitMQ disconnected gracefully');
  } catch (err) {
    logger.error(`Error closing RabbitMQ: ${err.message}`);
  }
};

module.exports = {
  connectRabbitMQ,
  getChannel,
  getFallbackBroker,
  closeRabbitMQ,
  QUEUE_NAME,
  DLQ_NAME,
  EXCHANGE_NAME,
  DLX_EXCHANGE
};
