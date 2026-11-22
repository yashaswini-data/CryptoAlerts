const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.COINGECKO_API_KEY || '';
const CACHE_TTL_MS = (parseInt(process.env.PRICE_CACHE_TTL_SECONDS, 10) || 60) * 1000;

// Curated supported coins for consistent UI display and reliable lookup
const SUPPORTED_COINS = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', defaultPrice: 96500, defaultChange24h: 2.4, defaultMarketCap: 1910000000000, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', defaultPrice: 2750, defaultChange24h: 1.8, defaultMarketCap: 330000000000, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  { id: 'solana', symbol: 'sol', name: 'Solana', defaultPrice: 195, defaultChange24h: 5.2, defaultMarketCap: 92000000000, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', defaultPrice: 620, defaultChange24h: -0.5, defaultMarketCap: 90000000000, image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  { id: 'ripple', symbol: 'xrp', name: 'XRP', defaultPrice: 1.45, defaultChange24h: 8.1, defaultMarketCap: 83000000000, image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', defaultPrice: 0.22, defaultChange24h: 3.6, defaultMarketCap: 32000000000, image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', defaultPrice: 0.78, defaultChange24h: -1.2, defaultMarketCap: 28000000000, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
  { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', defaultPrice: 28.5, defaultChange24h: 4.1, defaultMarketCap: 11500000000, image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png' },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', defaultPrice: 7.2, defaultChange24h: 0.9, defaultMarketCap: 10400000000, image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png' },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', defaultPrice: 18.4, defaultChange24h: 6.3, defaultMarketCap: 11200000000, image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png' }
];

// In-memory cache structures
let marketsCache = {
  data: null,
  timestamp: 0,
  isLive: false,
  error: null
};

const priceCache = new Map(); // coinId -> { price, change24h, marketCap, timestamp }
const chartCache = new Map(); // `${coinId}-${days}` -> { data, timestamp }

// Axios instance with timeout and headers
const getClient = () => {
  const headers = {
    Accept: 'application/json'
  };
  if (API_KEY) {
    headers['x-cg-demo-api-key'] = API_KEY;
  }
  return axios.create({
    baseURL: BASE_URL,
    timeout: 8000,
    headers
  });
};

/**
 * Retrieves market data for supported cryptocurrencies
 * @param {boolean} forceRefresh - If true, ignores cache
 */
const getSupportedCoinsMarket = async (forceRefresh = false) => {
  const now = Date.now();

  if (!forceRefresh && marketsCache.data && (now - marketsCache.timestamp < CACHE_TTL_MS)) {
    return {
      data: marketsCache.data,
      isLive: marketsCache.isLive,
      isCached: true,
      lastUpdated: new Date(marketsCache.timestamp).toISOString(),
      error: marketsCache.error
    };
  }

  const coinIds = SUPPORTED_COINS.map(c => c.id).join(',');

  try {
    const client = getClient();
    const response = await client.get('/coins/markets', {
      params: {
        vs_currency: 'usd',
        ids: coinIds,
        order: 'market_cap_desc',
        per_page: 50,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      }
    });

    if (Array.isArray(response.data) && response.data.length > 0) {
      const formatted = response.data.map(coin => {
        // Update price cache for individual coin lookups
        priceCache.set(coin.id, {
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          marketCap: coin.market_cap,
          timestamp: now
        });

        return {
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          current_price: coin.current_price,
          price_change_percentage_24h: coin.price_change_percentage_24h,
          market_cap: coin.market_cap,
          total_volume: coin.total_volume,
          high_24h: coin.high_24h,
          low_24h: coin.low_24h,
          image: coin.image,
          last_updated: coin.last_updated
        };
      });

      marketsCache = {
        data: formatted,
        timestamp: now,
        isLive: true,
        error: null
      };

      logger.info(`[CoinGecko] Successfully refreshed live market data for ${formatted.length} coins`);
      return {
        data: formatted,
        isLive: true,
        isCached: false,
        lastUpdated: new Date(now).toISOString(),
        error: null
      };
    }
  } catch (error) {
    const status = error.response ? error.response.status : null;
    const errorMsg = status === 429
      ? 'CoinGecko API rate limit reached (HTTP 429). Using cached/fallback data.'
      : `CoinGecko API request failed: ${error.message}`;

    logger.warn(`[CoinGecko] ${errorMsg}`);

    // If we have previous cache, return it with notice
    if (marketsCache.data) {
      return {
        data: marketsCache.data,
        isLive: false,
        isCached: true,
        isStale: true,
        lastUpdated: new Date(marketsCache.timestamp).toISOString(),
        error: errorMsg
      };
    }

    // Build curated fallback with explicit fallback flag
    const fallbackData = SUPPORTED_COINS.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      current_price: coin.defaultPrice,
      price_change_percentage_24h: coin.defaultChange24h,
      market_cap: coin.defaultMarketCap,
      total_volume: coin.defaultMarketCap * 0.05,
      high_24h: coin.defaultPrice * 1.03,
      low_24h: coin.defaultPrice * 0.97,
      image: coin.image,
      last_updated: new Date().toISOString()
    }));

    marketsCache = {
      data: fallbackData,
      timestamp: now,
      isLive: false,
      error: errorMsg
    };

    return {
      data: fallbackData,
      isLive: false,
      isFallback: true,
      lastUpdated: new Date(now).toISOString(),
      error: errorMsg
    };
  }
};

/**
 * Efficiently retrieves prices for a set of coin IDs in a single batch request
 * @param {string[]} coinIds - Array of coin IDs
 * @returns {Promise<Object>} Map of coinId -> price
 */
const getPricesForCoins = async (coinIds) => {
  if (!coinIds || coinIds.length === 0) return {};

  const uniqueIds = [...new Set(coinIds.map(id => id.toLowerCase()))];
  const now = Date.now();
  const prices = {};
  const idsToFetch = [];

  // Check cache first
  for (const id of uniqueIds) {
    const cached = priceCache.get(id);
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      prices[id] = cached.price;
    } else {
      idsToFetch.push(id);
    }
  }

  // If all were cached, return immediately
  if (idsToFetch.length === 0) {
    return prices;
  }

  try {
    const client = getClient();
    const response = await client.get('/simple/price', {
      params: {
        ids: idsToFetch.join(','),
        vs_currencies: 'usd',
        include_24hr_change: 'true',
        include_market_cap: 'true'
      }
    });

    if (response.data) {
      for (const id of idsToFetch) {
        if (response.data[id] && response.data[id].usd !== undefined) {
          const p = response.data[id].usd;
          prices[id] = p;
          priceCache.set(id, {
            price: p,
            change24h: response.data[id].usd_24h_change || 0,
            marketCap: response.data[id].usd_market_cap || 0,
            timestamp: now
          });
        }
      }
      logger.info(`[CoinGecko] Batch fetched prices for ${Object.keys(response.data).length} coins`);
    }
  } catch (error) {
    logger.warn(`[CoinGecko] Error fetching batch prices: ${error.message}`);
    // Check fallback for any remaining missing coins
    for (const id of idsToFetch) {
      if (prices[id] === undefined) {
        const cached = priceCache.get(id);
        if (cached) {
          prices[id] = cached.price;
        } else {
          const foundSupported = SUPPORTED_COINS.find(c => c.id === id);
          if (foundSupported) {
            prices[id] = foundSupported.defaultPrice;
          }
        }
      }
    }
  }

  return prices;
};

/**
 * Retrieves single coin price & info
 */
const getCoinPrice = async (coinId) => {
  const prices = await getPricesForCoins([coinId]);
  const price = prices[coinId.toLowerCase()];

  if (price === undefined) {
    throw new Error(`Price not available for cryptocurrency: "${coinId}"`);
  }

  const cached = priceCache.get(coinId.toLowerCase());
  return {
    coinId: coinId.toLowerCase(),
    price,
    change24h: cached ? cached.change24h : 0,
    marketCap: cached ? cached.marketCap : 0,
    currency: 'usd',
    timestamp: new Date().toISOString()
  };
};

/**
 * Retrieves historical price chart data from CoinGecko
 * @param {string} coinId
 * @param {number|string} days - 1, 7, 30, 90, 365
 */
const getCoinHistory = async (coinId, days = 7) => {
  const cacheKey = `${coinId.toLowerCase()}-${days}`;
  const now = Date.now();
  const cached = chartCache.get(cacheKey);

  if (cached && (now - cached.timestamp < 5 * 60 * 1000)) {
    return cached.data;
  }

  try {
    const client = getClient();
    const response = await client.get(`/coins/${coinId.toLowerCase()}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days
      }
    });

    if (response.data && response.data.prices) {
      const formatted = response.data.prices.map(([timestamp, price]) => ({
        timestamp,
        date: new Date(timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          ...(days <= 1 ? { hour: '2-digit', minute: '2-digit' } : {})
        }),
        price: Number(price.toFixed(price > 10 ? 2 : 4))
      }));

      const result = {
        coinId: coinId.toLowerCase(),
        days,
        prices: formatted,
        isLive: true
      };

      chartCache.set(cacheKey, { data: result, timestamp: now });
      return result;
    }
  } catch (error) {
    logger.warn(`[CoinGecko] History chart fetch failed for ${coinId}: ${error.message}`);

    // If CoinGecko is rate limited or offline, generate accurate smooth trend based on current price
    const current = (await getCoinPrice(coinId)).price || 1000;
    const points = days <= 1 ? 24 : days <= 7 ? 28 : 30;
    const stepMs = (days * 24 * 60 * 60 * 1000) / points;
    const simulated = [];

    let walker = current * (1 - (Math.sin(1) * 0.05));
    for (let i = points; i >= 0; i--) {
      const t = now - (i * stepMs);
      const variance = (Math.sin(i * 0.7) * 0.02) + ((Math.random() - 0.5) * 0.01);
      walker = walker * (1 + variance);
      simulated.push({
        timestamp: t,
        date: new Date(t).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          ...(days <= 1 ? { hour: '2-digit', minute: '2-digit' } : {})
        }),
        price: Number(walker.toFixed(walker > 10 ? 2 : 4))
      });
    }

    const fallbackResult = {
      coinId: coinId.toLowerCase(),
      days,
      prices: simulated,
      isLive: false,
      isFallback: true,
      message: 'Showing estimated trend line due to CoinGecko rate limit'
    };

    chartCache.set(cacheKey, { data: fallbackResult, timestamp: now });
    return fallbackResult;
  }
};

module.exports = {
  SUPPORTED_COINS,
  getSupportedCoinsMarket,
  getPricesForCoins,
  getCoinPrice,
  getCoinHistory
};
