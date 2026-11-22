const express = require('express');
const router = express.Router();
const {
  createAlert,
  getAlerts,
  getAlert,
  updateAlert,
  pauseAlert,
  resumeAlert,
  deleteAlert
} = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
const { createAlertValidator, updateAlertValidator } = require('../utils/validators');

// All alert routes are protected with JWT auth
router.use(protect);

router.route('/')
  .post(createAlertValidator, createAlert)
  .get(getAlerts);

router.route('/:id')
  .get(getAlert)
  .patch(updateAlertValidator, updateAlert)
  .delete(deleteAlert);

router.patch('/:id/pause', pauseAlert);
router.patch('/:id/resume', resumeAlert);

module.exports = router;
