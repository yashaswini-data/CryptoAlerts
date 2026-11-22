const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Cryptocurrency Coins API Tests', () => {
  test('GET /api/coins - Retrieve supported coins market overview', async () => {
    const res = await request(app).get('/api/coins');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.coins)).toBe(true);
    expect(res.body.coins.length).toBeGreaterThan(0);

    const btc = res.body.coins.find(c => c.id === 'bitcoin');
    expect(btc).toBeDefined();
    expect(btc.symbol).toBe('BTC');
    expect(btc.current_price).toBeGreaterThan(0);
    expect(btc.price_change_percentage_24h).toBeDefined();
  });

  test('GET /api/coins/:coinId/price - Retrieve single coin price', async () => {
    const res = await request(app).get('/api/coins/ethereum/price');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.coinId).toBe('ethereum');
    expect(res.body.data.price).toBeGreaterThan(0);
    expect(res.body.data.currency).toBe('usd');
  });

  test('GET /api/coins/:coinId/history - Retrieve historical price chart points', async () => {
    const res = await request(app).get('/api/coins/solana/history?days=7');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.coinId).toBe('solana');
    expect(Array.isArray(res.body.data.prices)).toBe(true);
    expect(res.body.data.prices.length).toBeGreaterThan(0);
    expect(res.body.data.prices[0].price).toBeGreaterThan(0);
    expect(res.body.data.prices[0].date).toBeDefined();
  });
});
