const cron = require('node-cron');
const Alert = require('../models/Alert');
const PriceHistory = require('../models/PriceHistory');
const { getPricesForCoins } = require('../services/coinGeckoService');
const { publishNotificationEvent } = require('../queues/publisher');
const logger = require('../utils/logger');

let cronTask = null;
let isJobRunning = false;

/**
 * Executes a single price evaluation cycle across all ACTIVE alerts
 * @returns {Promise<Object>} Statistics of the monitoring cycle
 */
const runPriceCheckCycle = async () => {
  if (isJobRunning) {
    logger.warn('[Price Monitor Job] Previous cycle is still running. Skipping this turn to prevent overlap.');
    return { skipped: true };
  }

  isJobRunning = true;
  const startTime = Date.now();
  const stats = {
    activeAlertsCount: 0,
    coinsChecked: 0,
    triggeredCount: 0,
    errors: []
  };

  try {
    // 1. Fetch all ACTIVE alerts
    const activeAlerts = await Alert.find({ status: 'ACTIVE' });
    stats.activeAlertsCount = activeAlerts.length;

    if (activeAlerts.length === 0) {
      isJobRunning = false;
      return stats;
    }

    // 2. Identify unique cryptocurrency IDs
    const uniqueCoinIds = [...new Set(activeAlerts.map(a => a.coinId.toLowerCase()))];
    stats.coinsChecked = uniqueCoinIds.length;

    // 3. Efficiently fetch prices in batch
    const prices = await getPricesForCoins(uniqueCoinIds);

    // 4. Save price snapshots to PriceHistory
    const historyDocs = [];
    for (const [coinId, price] of Object.entries(prices)) {
      if (price !== undefined && price !== null) {
        historyDocs.push({
          coinId,
          price,
          currency: 'usd',
          fetchedAt: new Date()
        });
      }
    }
    if (historyDocs.length > 0) {
      try {
        await PriceHistory.insertMany(historyDocs, { ordered: false });
      } catch (historyErr) {
        // Non-blocking log for history insertion
        logger.debug(`[Price Monitor Job] PriceHistory insertion notice: ${historyErr.message}`);
      }
    }

    // 5. Evaluate conditions for each active alert
    for (const alert of activeAlerts) {
      const currentPrice = prices[alert.coinId.toLowerCase()];

      if (currentPrice === undefined || currentPrice === null) {
        continue;
      }

      let isConditionMet = false;
      if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
        isConditionMet = true;
      } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
        isConditionMet = true;
      }

      if (isConditionMet) {
        // 6. Atomically change status from ACTIVE to TRIGGERED to prevent race conditions
        const now = new Date();
        const triggeredAlert = await Alert.findOneAndUpdate(
          { _id: alert._id, status: 'ACTIVE' },
          { status: 'TRIGGERED', triggeredAt: now },
          { new: true }
        );

        if (triggeredAlert) {
          stats.triggeredCount++;
          logger.info(
            `[Price Monitor Job] Triggered alert ${alert._id} for user ${alert.userId}: ` +
            `${alert.coinSymbol} condition ${alert.condition} (Target: $${alert.targetPrice}, Current: $${currentPrice})`
          );

          // 7. Publish notification event to RabbitMQ
          try {
            await publishNotificationEvent({
              alertId: triggeredAlert._id,
              userId: triggeredAlert.userId,
              coinId: triggeredAlert.coinId,
              coinSymbol: triggeredAlert.coinSymbol,
              coinName: triggeredAlert.coinName,
              condition: triggeredAlert.condition,
              targetPrice: triggeredAlert.targetPrice,
              currentPrice: currentPrice,
              timestamp: now.toISOString()
            });
          } catch (pubErr) {
            logger.error(`[Price Monitor Job] Failed to publish event for alert ${alert._id}: ${pubErr.message}`);
            stats.errors.push(`Publish error for ${alert._id}: ${pubErr.message}`);
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      `[Price Monitor Job] Cycle completed in ${duration}ms. Active alerts: ${stats.activeAlertsCount}, ` +
      `Coins: ${stats.coinsChecked}, Triggered: ${stats.triggeredCount}`
    );
  } catch (error) {
    logger.error(`[Price Monitor Job] Unhandled error during price monitoring: ${error.message}`);
    stats.errors.push(error.message);
  } finally {
    isJobRunning = false;
  }

  return stats;
};

/**
 * Starts the cron job according to the configured schedule
 */
const startPriceMonitorJob = () => {
  const schedule = process.env.CRON_SCHEDULE || '*/30 * * * * *';

  if (!cron.validate(schedule)) {
    logger.error(`[Price Monitor Job] Invalid cron schedule: "${schedule}". Defaulting to every 30 seconds.`);
  }

  const validSchedule = cron.validate(schedule) ? schedule : '*/30 * * * * *';

  logger.info(`[Price Monitor Job] Initializing price monitoring cron job with schedule: "${validSchedule}"`);

  cronTask = cron.schedule(validSchedule, async () => {
    await runPriceCheckCycle();
  });

  return cronTask;
};

const stopPriceMonitorJob = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('[Price Monitor Job] Scheduled cron job stopped.');
  }
};

module.exports = {
  startPriceMonitorJob,
  stopPriceMonitorJob,
  runPriceCheckCycle
};
