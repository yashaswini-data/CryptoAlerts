const { body, validationResult } = require('express-validator');

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map(err => ({ field: err.path, msg: err.msg }))
    });
  }
  next();
};

const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (req.body.confirmPassword && value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  validateResult
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateResult
];

const createAlertValidator = [
  body('coinId')
    .trim()
    .notEmpty()
    .withMessage('Cryptocurrency ID is required'),
  body('targetPrice')
    .notEmpty()
    .withMessage('Target price is required')
    .isFloat({ gt: 0 })
    .withMessage('Target price must be a positive number greater than 0'),
  body('condition')
    .trim()
    .notEmpty()
    .withMessage('Condition is required')
    .toUpperCase()
    .isIn(['ABOVE', 'BELOW'])
    .withMessage('Condition must be either ABOVE or BELOW'),
  validateResult
];

const updateAlertValidator = [
  body('targetPrice')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Target price must be a positive number greater than 0'),
  body('condition')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['ABOVE', 'BELOW'])
    .withMessage('Condition must be either ABOVE or BELOW'),
  validateResult
];

module.exports = {
  validateResult,
  registerValidator,
  loginValidator,
  createAlertValidator,
  updateAlertValidator
};
