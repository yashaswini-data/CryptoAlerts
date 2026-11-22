const Alert = require('../models/Alert');
const { SUPPORTED_COINS, getPricesForCoins } = require('./coinGeckoService');
const logger = require('../utils/logger');

/**
 * Creates a new price alert for a user
 */
const createAlert = async (userId, alertData) => {
  const { coinId, targetPrice, condition } = alertData;

  const normalizedCoinId = coinId.trim().toLowerCase();
  const parsedTargetPrice = Number(targetPrice);
  const normalizedCondition = condition.trim().toUpperCase();

  // Validate condition
  if (!['ABOVE', 'BELOW'].includes(normalizedCondition)) {
    const error = new Error('Condition must be either ABOVE or BELOW');
    error.statusCode = 400;
    throw error;
  }

  // Validate target price
  if (isNaN(parsedTargetPrice) || parsedTargetPrice <= 0) {
    const error = new Error('Target price must be a positive number greater than 0');
    error.statusCode = 400;
    throw error;
  }

  // Lookup coin symbol and name
  const foundCoin = SUPPORTED_COINS.find(c => c.id === normalizedCoinId);
  const coinSymbol = foundCoin ? foundCoin.symbol.toUpperCase() : normalizedCoinId.slice(0, 4).toUpperCase();
  const coinName = foundCoin ? foundCoin.name : normalizedCoinId;

  // Prevent duplicate active alerts with the exact same condition and price
  const existingActiveAlert = await Alert.findOne({
    userId,
    coinId: normalizedCoinId,
    targetPrice: parsedTargetPrice,
    condition: normalizedCondition,
    status: 'ACTIVE'
  });

  if (existingActiveAlert) {
    const error = new Error('An active alert with the exact same cryptocurrency, condition, and target price already exists.');
    error.statusCode = 400;
    throw error;
  }

  const alert = await Alert.create({
    userId,
    coinId: normalizedCoinId,
    coinSymbol,
    coinName,
    targetPrice: parsedTargetPrice,
    condition: normalizedCondition,
    status: 'ACTIVE'
  });

  logger.info(`[Alert Service] User ${userId} created alert ${alert._id} for ${coinSymbol} ${normalizedCondition} $${parsedTargetPrice}`);
  return alert;
};

/**
 * Retrieves all alerts for a specific user, with optional status filter
 */
const getUserAlerts = async (userId, filter = {}) => {
  const query = { userId };
  if (filter.status && ['ACTIVE', 'TRIGGERED', 'PAUSED'].includes(filter.status.toUpperCase())) {
    query.status = filter.status.toUpperCase();
  }

  const alerts = await Alert.find(query).sort({ createdAt: -1 });

  // Enrich with current live prices
  if (alerts.length > 0) {
    const coinIds = alerts.map(a => a.coinId);
    const livePrices = await getPricesForCoins(coinIds);

    return alerts.map(alert => {
      const alertObj = alert.toObject();
      alertObj.currentPrice = livePrices[alert.coinId] !== undefined ? livePrices[alert.coinId] : null;
      return alertObj;
    });
  }

  return alerts;
};

/**
 * Retrieves a single alert by ID, verifying ownership
 */
const getAlertById = async (alertId, userId) => {
  const alert = await Alert.findOne({ _id: alertId, userId });
  if (!alert) {
    const error = new Error('Alert not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const alertObj = alert.toObject();
  const prices = await getPricesForCoins([alert.coinId]);
  alertObj.currentPrice = prices[alert.coinId] !== undefined ? prices[alert.coinId] : null;

  return alertObj;
};

/**
 * Updates an alert's target price or condition
 */
const updateAlert = async (alertId, userId, updateData) => {
  const alert = await Alert.findOne({ _id: alertId, userId });
  if (!alert) {
    const error = new Error('Alert not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  if (updateData.targetPrice !== undefined) {
    const targetPrice = Number(updateData.targetPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      const error = new Error('Target price must be a positive number greater than 0');
      error.statusCode = 400;
      throw error;
    }
    alert.targetPrice = targetPrice;
  }

  if (updateData.condition !== undefined) {
    const cond = updateData.condition.trim().toUpperCase();
    if (!['ABOVE', 'BELOW'].includes(cond)) {
      const error = new Error('Condition must be either ABOVE or BELOW');
      error.statusCode = 400;
      throw error;
    }
    alert.condition = cond;
  }

  // Check duplicate active alert with new values
  if (alert.status === 'ACTIVE') {
    const duplicate = await Alert.findOne({
      _id: { $ne: alert._id },
      userId,
      coinId: alert.coinId,
      targetPrice: alert.targetPrice,
      condition: alert.condition,
      status: 'ACTIVE'
    });

    if (duplicate) {
      const error = new Error('An active alert with the exact same cryptocurrency, condition, and target price already exists.');
      error.statusCode = 400;
      throw error;
    }
  }

  await alert.save();
  logger.info(`[Alert Service] Updated alert ${alertId} for user ${userId}`);
  return alert;
};

/**
 * Pauses an active alert
 */
const pauseAlert = async (alertId, userId) => {
  const alert = await Alert.findOne({ _id: alertId, userId });
  if (!alert) {
    const error = new Error('Alert not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  if (alert.status === 'PAUSED') {
    return alert; // Already paused
  }

  alert.status = 'PAUSED';
  await alert.save();
  logger.info(`[Alert Service] Paused alert ${alertId}`);
  return alert;
};

/**
 * Resumes a paused alert
 */
const resumeAlert = async (alertId, userId) => {
  const alert = await Alert.findOne({ _id: alertId, userId });
  if (!alert) {
    const error = new Error('Alert not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  // Check if resuming would collide with another active alert
  const duplicate = await Alert.findOne({
    _id: { $ne: alert._id },
    userId,
    coinId: alert.coinId,
    targetPrice: alert.targetPrice,
    condition: alert.condition,
    status: 'ACTIVE'
  });

  if (duplicate) {
    const error = new Error('Cannot resume: another active alert already exists with identical parameters.');
    error.statusCode = 400;
    throw error;
  }

  alert.status = 'ACTIVE';
  await alert.save();
  logger.info(`[Alert Service] Resumed alert ${alertId}`);
  return alert;
};

/**
 * Deletes an alert
 */
const deleteAlert = async (alertId, userId) => {
  const alert = await Alert.findOneAndDelete({ _id: alertId, userId });
  if (!alert) {
    const error = new Error('Alert not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }
  logger.info(`[Alert Service] Deleted alert ${alertId}`);
  return { message: 'Alert successfully deleted', alertId };
};

module.exports = {
  createAlert,
  getUserAlerts,
  getAlertById,
  updateAlert,
  pauseAlert,
  resumeAlert,
  deleteAlert
};
