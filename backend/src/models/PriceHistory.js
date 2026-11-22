const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema(
  {
    coinId: {
      type: String,
      required: [true, 'Coin ID is required'],
      lowercase: true,
      trim: true,
      index: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required']
    },
    currency: {
      type: String,
      default: 'usd',
      lowercase: true
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

// Compound index for querying recent price histories by coin
priceHistorySchema.index({ coinId: 1, fetchedAt: -1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
