const alertService = require('../services/alertService');

/**
 * @desc    Create a new crypto price alert
 * @route   POST /api/alerts
 * @access  Private
 */
const createAlert = async (req, res, next) => {
  try {
    const alert = await alertService.createAlert(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all alerts for logged in user
 * @route   GET /api/alerts
 * @access  Private
 */
const getAlerts = async (req, res, next) => {
  try {
    const alerts = await alertService.getUserAlerts(req.user._id, {
      status: req.query.status
    });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single alert by ID
 * @route   GET /api/alerts/:id
 * @access  Private
 */
const getAlert = async (req, res, next) => {
  try {
    const alert = await alertService.getAlertById(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update alert (target price or condition)
 * @route   PATCH /api/alerts/:id
 * @access  Private
 */
const updateAlert = async (req, res, next) => {
  try {
    const updated = await alertService.updateAlert(req.params.id, req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: 'Alert updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Pause an active alert
 * @route   PATCH /api/alerts/:id/pause
 * @access  Private
 */
const pauseAlert = async (req, res, next) => {
  try {
    const alert = await alertService.pauseAlert(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Alert paused',
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resume a paused alert
 * @route   PATCH /api/alerts/:id/resume
 * @access  Private
 */
const resumeAlert = async (req, res, next) => {
  try {
    const alert = await alertService.resumeAlert(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Alert resumed',
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an alert
 * @route   DELETE /api/alerts/:id
 * @access  Private
 */
const deleteAlert = async (req, res, next) => {
  try {
    const result = await alertService.deleteAlert(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAlert,
  getAlerts,
  getAlert,
  updateAlert,
  pauseAlert,
  resumeAlert,
  deleteAlert
};
