const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Alerts API Tests', () => {
  let user1Token;
  let user2Token;
  let user1Id;

  beforeEach(async () => {
    // Register user 1
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123'
    });
    user1Token = res1.body.token;
    user1Id = res1.body.user.id;

    // Register user 2
    const res2 = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123'
    });
    user2Token = res2.body.token;
  });

  test('POST /api/alerts - Create an ABOVE alert', async () => {
    const res = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        coinId: 'bitcoin',
        targetPrice: 100000,
        condition: 'ABOVE'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.coinId).toBe('bitcoin');
    expect(res.body.data.targetPrice).toBe(100000);
    expect(res.body.data.condition).toBe('ABOVE');
    expect(res.body.data.status).toBe('ACTIVE');
  });

  test('POST /api/alerts - Create a BELOW alert', async () => {
    const res = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        coinId: 'ethereum',
        targetPrice: 2500,
        condition: 'BELOW'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.coinId).toBe('ethereum');
    expect(res.body.data.condition).toBe('BELOW');
  });

  test('POST /api/alerts - Reject invalid target price (<= 0)', async () => {
    const res = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        coinId: 'bitcoin',
        targetPrice: -50,
        condition: 'ABOVE'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/alerts - Reject duplicate active alert', async () => {
    // First alert
    await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        coinId: 'bitcoin',
        targetPrice: 100000,
        condition: 'ABOVE'
      });

    // Duplicate alert attempt
    const duplicateRes = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        coinId: 'bitcoin',
        targetPrice: 100000,
        condition: 'ABOVE'
      });

    expect(duplicateRes.statusCode).toBe(400);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.message).toMatch(/already exists/i);
  });

  test('PATCH /api/alerts/:id/pause and /resume - Pause and resume alert', async () => {
    const createRes = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        coinId: 'solana',
        targetPrice: 250,
        condition: 'ABOVE'
      });
    const alertId = createRes.body.data._id;

    // Pause
    const pauseRes = await request(app)
      .patch(`/api/alerts/${alertId}/pause`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(pauseRes.statusCode).toBe(200);
    expect(pauseRes.body.data.status).toBe('PAUSED');

    // Resume
    const resumeRes = await request(app)
      .patch(`/api/alerts/${alertId}/resume`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(resumeRes.statusCode).toBe(200);
    expect(resumeRes.body.data.status).toBe('ACTIVE');
  });

  test('PATCH /api/alerts/:id - Update alert target price', async () => {
    const createRes = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        coinId: 'bitcoin',
        targetPrice: 95000,
        condition: 'ABOVE'
      });
    const alertId = createRes.body.data._id;

    const updateRes = await request(app)
      .patch(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        targetPrice: 98000
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.targetPrice).toBe(98000);
  });

  test('DELETE /api/alerts/:id - Delete alert', async () => {
    const createRes = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        coinId: 'cardano',
        targetPrice: 1.0,
        condition: 'ABOVE'
      });
    const alertId = createRes.body.data._id;

    const delRes = await request(app)
      .delete(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(delRes.statusCode).toBe(200);

    // Verify deletion
    const getRes = await request(app)
      .get(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(getRes.statusCode).toBe(404);
  });

  test('Prevent user from accessing another user’s alert', async () => {
    // User 1 creates an alert
    const createRes = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        coinId: 'bitcoin',
        targetPrice: 100000,
        condition: 'ABOVE'
      });
    const alertId = createRes.body.data._id;

    // User 2 attempts to get it
    const getRes = await request(app)
      .get(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(getRes.statusCode).toBe(404);

    // User 2 attempts to delete it
    const delRes = await request(app)
      .delete(`/api/alerts/${alertId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(delRes.statusCode).toBe(404);
  });
});
