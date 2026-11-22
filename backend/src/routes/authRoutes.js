const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidator, loginValidator } = require('../utils/validators');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerValidator, registerUser);
router.post('/login', authLimiter, loginValidator, loginUser);
router.get('/me', protect, getMe);

module.exports = router;
