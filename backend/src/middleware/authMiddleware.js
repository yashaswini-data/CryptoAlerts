const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_cryptoalerts_2026');

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      logger.warn(`Authentication failed: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: error.name === 'TokenExpiredError' ? 'Token expired. Please log in again.' : 'Invalid token. Not authorized.'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no bearer token provided'
    });
  }
};

module.exports = { protect };
