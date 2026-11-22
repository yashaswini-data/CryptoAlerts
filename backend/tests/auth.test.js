const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Authentication API Tests', () => {
  const testUser = {
    name: 'Alice Satoshi',
    email: 'alice@cryptoalerts.io',
    password: 'password123',
    confirmPassword: 'password123'
  };

  test('POST /api/auth/register - Successfully register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body.user.password).toBeUndefined();
  });

  test('POST /api/auth/register - Prevent duplicate email registration', async () => {
    // First registration
    await request(app).post('/api/auth/register').send(testUser);

    // Duplicate registration attempt
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('POST /api/auth/register - Reject invalid password (< 6 characters)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob',
        email: 'bob@example.com',
        password: '123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - Successfully login with valid credentials', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
  });

  test('POST /api/auth/login - Reject invalid credentials (wrong password)', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me - Access protected profile with valid token', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.stats).toBeDefined();
  });

  test('GET /api/auth/me - Reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
