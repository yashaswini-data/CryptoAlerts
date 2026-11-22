const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Formats a currency number for notifications
 */
const formatPrice = (price) => {
  if (price >= 1) {
    return `$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })}`;
};

/**
 * Creates a notification in the database with strict idempotency
 * @param {Object} eventData - Validated alert event data
 * @returns {Promise<Object>}
 */
const processNotificationEvent = async (eventData) => {
  const {
    eventId,
    alertId,
    userId,
    coinId,
    coinSymbol,
    coinName,
    condition,
    targetPrice,
    currentPrice
  } = eventData;

  // Validate required fields
  if (!alertId || !userId || !coinId || !targetPrice || currentPrice === undefined) {
    throw new Error('Invalid notification event payload: missing mandatory fields');
  }

  // Idempotency check: prevent duplicate notifications for the same event
  if (eventId) {
    const existing = await Notification.findOne({ eventId });
    if (existing) {
      logger.info(`[Notification Service] Duplicate event detected for eventId: ${eventId}. Skipping creation.`);
      return existing;
    }
  }

  const name = coinName || coinSymbol || coinId;
  const symbol = coinSymbol ? `(${coinSymbol.toUpperCase()})` : '';
  const condText = condition === 'ABOVE' ? 'reached or exceeded' : 'dropped to or below';

  const message = `Alert Triggered: ${name} ${symbol} has ${condText} your target of ${formatPrice(targetPrice)} (Current Price: ${formatPrice(currentPrice)}).`;

  const notification = await Notification.create({
    userId,
    alertId,
    eventId,
    message,
    coinId,
    currentPrice,
    targetPrice,
    isRead: false
  });

  logger.info(`[Notification Service] Created notification ${notification._id} for user ${userId} on alert ${alertId}`);
  return notification;
};

module.exports = {
  processNotificationEvent,
  formatPrice
};
