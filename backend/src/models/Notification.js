const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    alertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      required: [true, 'Alert ID is required'],
      index: true
    },
    eventId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required']
    },
    coinId: {
      type: String,
      required: [true, 'Coin ID is required']
    },
    currentPrice: {
      type: Number,
      required: [true, 'Current price is required']
    },
    targetPrice: {
      type: Number,
      required: [true, 'Target price is required']
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
