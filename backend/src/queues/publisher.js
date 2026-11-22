const { v4: uuidv4 } = require('uuid');
const { getChannel, getFallbackBroker, QUEUE_NAME, EXCHANGE_NAME } = require('../config/rabbitmq');
const logger = require('../utils/logger');

/**
 * Publishes a triggered alert notification event to RabbitMQ
 * @param {Object} alertData - The triggered alert payload
 * @returns {Promise<boolean>}
 */
const publishNotificationEvent = async (alertData) => {
  const eventPayload = {
    eventId: alertData.eventId || uuidv4(),
    alertId: alertData.alertId,
    userId: alertData.userId,
    coinId: alertData.coinId,
    coinSymbol: alertData.coinSymbol,
    coinName: alertData.coinName || alertData.coinId,
    condition: alertData.condition,
    targetPrice: alertData.targetPrice,
    currentPrice: alertData.currentPrice,
    timestamp: alertData.timestamp || new Date().toISOString()
  };

  const channel = getChannel();

  if (channel) {
    try {
      const messageBuffer = Buffer.from(JSON.stringify(eventPayload));
      const published = channel.publish(
        EXCHANGE_NAME,
        QUEUE_NAME,
        messageBuffer,
        {
          persistent: true,
          contentType: 'application/json',
          messageId: eventPayload.eventId,
          timestamp: Date.now()
        }
      );

      if (published) {
        logger.info(`[RabbitMQ Publisher] Published alert event: ${eventPayload.eventId} for alert ${eventPayload.alertId}`);
        return true;
      } else {
        logger.warn(`[RabbitMQ Publisher] Channel buffer full, message queued for drain`);
        return false;
      }
    } catch (err) {
      logger.error(`[RabbitMQ Publisher] Failed to publish message: ${err.message}`);
      throw err;
    }
  } else {
    // In fallback mode
    const broker = getFallbackBroker();
    logger.info(`[Async Event Bus] Emitted alert event: ${eventPayload.eventId} for alert ${eventPayload.alertId}`);
    broker.emit('notification_event', eventPayload);
    return true;
  }
};

module.exports = { publishNotificationEvent };
