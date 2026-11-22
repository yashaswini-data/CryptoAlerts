const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    coinId: {
      type: String,
      required: [true, 'Coin ID is required'],
      lowercase: true,
      trim: true
    },
    coinSymbol: {
      type: String,
      required: [true, 'Coin symbol is required'],
      uppercase: true,
      trim: true
    },
    coinName: {
      type: String,
      default: ''
    },
    targetPrice: {
      type: Number,
      required: [true, 'Target price is required'],
      min: [0.00000001, 'Target price must be greater than zero']
    },
    condition: {
      type: String,
      required: [true, 'Alert condition is required'],
      enum: {
        values: ['ABOVE', 'BELOW'],
        message: 'Condition must be either ABOVE or BELOW'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'TRIGGERED', 'PAUSED'],
        message: 'Status must be ACTIVE, TRIGGERED, or PAUSED'
      },
      default: 'ACTIVE',
      index: true
    },
    triggeredAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate active alerts with identical user, coin, target price, and condition
alertSchema.index(
  { userId: 1, coinId: 1, targetPrice: 1, condition: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' }
  }
);

// Compound index for querying user alerts by status
alertSchema.index({ userId: 1, status: 1 });
// Index for price monitor cron job to fetch all ACTIVE alerts
alertSchema.index({ status: 1, coinId: 1 });

module.exports = mongoose.model('Alert', alertSchema);
