const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey_cryptoalerts_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password
    });

    const token = generateToken(user._id);

    logger.info(`User registered successfully: ${user.email} (${user._id})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.email} (${user._id})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile & summary stats
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Include quick summary metrics for the dashboard
    const [totalAlerts, activeAlerts, triggeredAlerts, unreadNotifications] = await Promise.all([
      Alert.countDocuments({ userId: user._id }),
      Alert.countDocuments({ userId: user._id, status: 'ACTIVE' }),
      Alert.countDocuments({ userId: user._id, status: 'TRIGGERED' }),
      Notification.countDocuments({ userId: user._id, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      stats: {
        totalAlerts,
        activeAlerts,
        triggeredAlerts,
        unreadNotifications
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
