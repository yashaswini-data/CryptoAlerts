const { getChannel, getFallbackBroker, QUEUE_NAME, DLQ_NAME } = require('../config/rabbitmq');
const { processNotificationEvent } = require('../services/notificationService');
const logger = require('../utils/logger');

let consumerTag = null;
let fallbackListener = null;

/**
 * Starts consuming notification messages from RabbitMQ (or fallback event bus)
 */
const startConsumer = async () => {
  const channel = getChannel();

  if (channel) {
    try {
      logger.info(`[RabbitMQ Consumer] Starting consumer on queue: "${QUEUE_NAME}"...`);

      const response = await channel.consume(
        QUEUE_NAME,
        async (msg) => {
          if (!msg) return;

          try {
            const contentStr = msg.content.toString();
            const eventData = JSON.parse(contentStr);

            logger.info(`[RabbitMQ Consumer] Received event ${eventData.eventId || 'unknown'} for alert ${eventData.alertId}`);

            // Process event and persist notification in MongoDB
            await processNotificationEvent(eventData);

            // Manual acknowledgement
            channel.ack(msg);
            logger.info(`[RabbitMQ Consumer] Acknowledged event ${eventData.eventId}`);
          } catch (error) {
            logger.error(`[RabbitMQ Consumer] Error processing message: ${error.message}`);

            // Inspect retry count from headers
            const deathHeader = msg.properties.headers && msg.properties.headers['x-death'];
            const retryCount = deathHeader ? deathHeader[0].count : 0;

            if (retryCount >= 3) {
              logger.error(`[RabbitMQ Consumer] Max retries (3) reached. Routing to DLQ: ${DLQ_NAME}`);
              channel.nack(msg, false, false); // Route to Dead Letter Queue
            } else {
              // Retry with reject or DLQ routing
              logger.warn(`[RabbitMQ Consumer] Rejecting message to Dead Letter Queue.`);
              channel.nack(msg, false, false);
            }
          }
        },
        { noAck: false } // Enforce manual acknowledgements
      );

      consumerTag = response.consumerTag;
      logger.info(`[RabbitMQ Consumer] Consumer active with tag: ${consumerTag}`);
      return consumerTag;
    } catch (err) {
      logger.error(`[RabbitMQ Consumer] Failed to start consumer: ${err.message}`);
      throw err;
    }
  } else {
    // Fallback mode for local dev without RabbitMQ
    const broker = getFallbackBroker();
    if (!fallbackListener) {
      fallbackListener = async (eventData) => {
        try {
          logger.info(`[Async Event Bus Consumer] Processing event ${eventData.eventId} for alert ${eventData.alertId}`);
          await processNotificationEvent(eventData);
        } catch (err) {
          logger.error(`[Async Event Bus Consumer] Error processing event: ${err.message}`);
        }
      };
      broker.on('notification_event', fallbackListener);
      logger.info('[Async Event Bus Consumer] Listening for notification events.');
    }
  }
};

const stopConsumer = async () => {
  const channel = getChannel();
  if (channel && consumerTag) {
    try {
      await channel.cancel(consumerTag);
      consumerTag = null;
      logger.info('[RabbitMQ Consumer] Consumer cancelled');
    } catch (err) {
      logger.error(`[RabbitMQ Consumer] Error cancelling consumer: ${err.message}`);
    }
  }

  if (fallbackListener) {
    const broker = getFallbackBroker();
    broker.removeListener('notification_event', fallbackListener);
    fallbackListener = null;
    logger.info('[Async Event Bus Consumer] Fallback listener stopped');
  }
};

module.exports = {
  startConsumer,
  stopConsumer
};
