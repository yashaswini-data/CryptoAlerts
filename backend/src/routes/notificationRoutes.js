const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All notification routes are protected
router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.get('/:id', getNotificationById);
router.patch('/:id/read', markAsRead);

module.exports = router;
