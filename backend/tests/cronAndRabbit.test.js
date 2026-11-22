const mongoose = require('mongoose');
const Alert = require('../src/models/Alert');
const Notification = require('../src/models/Notification');
const PriceHistory = require('../src/models/PriceHistory');
const { runPriceCheckCycle } = require('../src/jobs/priceMonitorJob');
const { startConsumer, stopConsumer } = require('../src/queues/consumer');
require('./setup');

describe('Cron Price Monitoring & Event Processing Tests', () => {
  let dummyUserId;

  beforeAll(async () => {
    // Start consumer to listen for emitted events
    await startConsumer();
  });

  afterAll(async () => {
    await stopConsumer();
  });

  beforeEach(() => {
    dummyUserId = new mongoose.Types.ObjectId();
  });

  test('Price above target triggers ABOVE alert and publishes notification event', async () => {
    // Create an active alert with a very low target price ($10) so current price easily triggers it
    const alert = await Alert.create({
      userId: dummyUserId,
      coinId: 'bitcoin',
      coinSymbol: 'BTC',
      coinName: 'Bitcoin',
      targetPrice: 10,
      condition: 'ABOVE',
      status: 'ACTIVE'
    });

    // Run price evaluation cycle
    const stats = await runPriceCheckCycle();

    expect(stats.triggeredCount).toBeGreaterThanOrEqual(1);

    // Verify alert status updated to TRIGGERED in MongoDB
    const updatedAlert = await Alert.findById(alert._id);
    expect(updatedAlert.status).toBe('TRIGGERED');
    expect(updatedAlert.triggeredAt).toBeDefined();

    // Give asynchronous consumer a moment to process the event
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify notification was created in MongoDB
    const notif = await Notification.findOne({ alertId: alert._id });
    expect(notif).toBeDefined();
    expect(notif.userId.toString()).toBe(dummyUserId.toString());
    expect(notif.currentPrice).toBeGreaterThan(10);
    expect(notif.isRead).toBe(false);

    // Verify PriceHistory was recorded
    const historyCount = await PriceHistory.countDocuments({ coinId: 'bitcoin' });
    expect(historyCount).toBeGreaterThan(0);
  });

  test('Paused and already-triggered alerts are ignored by the monitoring cycle', async () => {
    // Paused alert
    const pausedAlert = await Alert.create({
      userId: dummyUserId,
      coinId: 'ethereum',
      coinSymbol: 'ETH',
      targetPrice: 10,
      condition: 'ABOVE',
      status: 'PAUSED'
    });

    // Already triggered alert
    const triggeredAlert = await Alert.create({
      userId: dummyUserId,
      coinId: 'solana',
      coinSymbol: 'SOL',
      targetPrice: 10,
      condition: 'ABOVE',
      status: 'TRIGGERED',
      triggeredAt: new Date()
    });

    const stats = await runPriceCheckCycle();

    // Verify their status remains unchanged
    const checkPaused = await Alert.findById(pausedAlert._id);
    expect(checkPaused.status).toBe('PAUSED');

    const checkTriggered = await Alert.findById(triggeredAlert._id);
    expect(checkTriggered.status).toBe('TRIGGERED');
  });

  test('Condition not met does not trigger alert', async () => {
    // Alert with target price $10,000,000 ABOVE (Bitcoin is not $10M)
    const alert = await Alert.create({
      userId: dummyUserId,
      coinId: 'bitcoin',
      coinSymbol: 'BTC',
      targetPrice: 10000000,
      condition: 'ABOVE',
      status: 'ACTIVE'
    });

    await runPriceCheckCycle();

    const checkAlert = await Alert.findById(alert._id);
    expect(checkAlert.status).toBe('ACTIVE');
    expect(checkAlert.triggeredAt).toBeNull();
  });
});
