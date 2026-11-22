const {
  getSupportedCoinsMarket,
  getCoinPrice,
  getCoinHistory,
  SUPPORTED_COINS
} = require('../services/coinGeckoService');

/**
 * @desc    Get all supported cryptocurrencies with market data
 * @route   GET /api/coins
 * @access  Public
 */
const getCoins = async (req, res, next) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const result = await getSupportedCoinsMarket(forceRefresh);

    res.status(200).json({
      success: true,
      count: result.data.length,
      isLive: result.isLive,
      isCached: result.isCached || false,
      lastUpdated: result.lastUpdated,
      notice: result.error || null,
      coins: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get live price for a specific coin
 * @route   GET /api/coins/:coinId/price
 * @access  Public
 */
const getCoinPriceById = async (req, res, next) => {
  try {
    const { coinId } = req.params;
    const priceData = await getCoinPrice(coinId);

    res.status(200).json({
      success: true,
      data: priceData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get historical price data for charting
 * @route   GET /api/coins/:coinId/history
 * @access  Public
 */
const getCoinHistoryById = async (req, res, next) => {
  try {
    const { coinId } = req.params;
    const days = parseInt(req.query.days, 10) || 7;

    const historyData = await getCoinHistory(coinId, days);

    res.status(200).json({
      success: true,
      data: historyData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCoins,
  getCoinPriceById,
  getCoinHistoryById
};
