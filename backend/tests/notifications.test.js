const request = require('supertest');
const app = require('../src/app');
const { processNotificationEvent } = require('../src/services/notificationService');
const Alert = require('../src/models/Alert');
require('./setup');

describe('Notifications API and Service Tests', () => {
  let userToken;
  let userId;
  let testAlert;

  beforeEach(async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Crypto Investor',
      email: 'investor@example.com',
      password: 'password123'
    });
    userToken = regRes.body.token;
    userId = regRes.body.user.id;

    testAlert = await Alert.create({
      userId,
      coinId: 'bitcoin',
      coinSymbol: 'BTC',
      targetPrice: 100000,
      condition: 'ABOVE',
      status: 'ACTIVE'
    });
  });

  test('processNotificationEvent - Generates notification and enforces idempotency', async () => {
    const eventPayload = {
      eventId: 'evt-unique-12345',
      alertId: testAlert._id,
      userId: userId,
      coinId: 'bitcoin',
      coinSymbol: 'BTC',
      condition: 'ABOVE',
      targetPrice: 100000,
      currentPrice: 102500,
      timestamp: new Date().toISOString()
    };

    // First process
    const notif1 = await processNotificationEvent(eventPayload);
    expect(notif1).toBeDefined();
    expect(notif1.userId.toString()).toBe(userId.toString());
    expect(notif1.isRead).toBe(false);
    expect(notif1.message).toContain('Alert Triggered: BTC');

    // Duplicate event (idempotency test)
    const notif2 = await processNotificationEvent(eventPayload);
    expect(notif2._id.toString()).toBe(notif1._id.toString());
  });

  test('GET /api/notifications - Retrieve user notification history', async () => {
    await processNotificationEvent({
      eventId: 'evt-1',
      alertId: testAlert._id,
      userId: userId,
      coinId: 'bitcoin',
      coinSymbol: 'BTC',
      condition: 'ABOVE',
      targetPrice: 100000,
      currentPrice: 101000
    });

    await processNotificationEvent({
      eventId: 'evt-2',
      alertId: testAlert._id,
      userId: userId,
      coinId: 'bitcoin',
      coinSymbol: 'BTC',
      condition: 'ABOVE',
      targetPrice: 100000,
      currentPrice: 105000
    });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.unreadCount).toBe(2);
  });

  test('PATCH /api/notifications/:id/read - Mark notification as read', async () => {
    const notif = await processNotificationEvent({
      eventId: 'evt-read-test',
      alertId: testAlert._id,
      userId: userId,
      coinId: 'bitcoin',
      coinSymbol: 'BTC',
      condition: 'ABOVE',
      targetPrice: 100000,
      currentPrice: 102000
    });

    const res = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.isRead).toBe(true);
  });

  test('PATCH /api/notifications/read-all - Mark all notifications as read', async () => {
    await processNotificationEvent({
      eventId: 'evt-readall-1',
      alertId: testAlert._id,
      userId: userId,
      coinId: 'bitcoin',
      coinSymbol: 'BTC',
      condition: 'ABOVE',
      targetPrice: 100000,
      currentPrice: 101000
    });

    await processNotificationEvent({
      eventId: 'evt-readall-2',
      alertId: testAlert._id,
      userId: userId,
      coinId: 'bitcoin',
      coinSymbol: 'BTC',
      condition: 'ABOVE',
      targetPrice: 100000,
      currentPrice: 102000
    });

    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.modifiedCount).toBe(2);

    const checkRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(checkRes.body.unreadCount).toBe(0);
  });
});
