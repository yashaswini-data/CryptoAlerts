const express = require('express');
const router = express.Router();
const { getCoins, getCoinPriceById, getCoinHistoryById } = require('../controllers/coinController');

router.get('/', getCoins);
router.get('/:coinId/price', getCoinPriceById);
router.get('/:coinId/history', getCoinHistoryById);

module.exports = router;
