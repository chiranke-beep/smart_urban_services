const Analytics = require('../models/Analytics');

// @desc    Get average resolution times per category
// @route   GET /api/analytics/resolution-times
// @access  Private - admin
const getResolutionTimes = async (req, res) => {
  try {
    const data = await Analytics.getResolutionTimes();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getResolutionTimes error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get monthly incident volume trend
// @route   GET /api/analytics/monthly-volume?months=12
// @access  Private - admin
const getMonthlyVolume = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const data = await Analytics.getMonthlyVolume(Math.min(parseInt(months), 24));
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getMonthlyVolume error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get geographic hot zones
// @route   GET /api/analytics/hot-zones?limit=10
// @access  Private - admin
const getHotZones = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await Analytics.getHotZones(Math.min(parseInt(limit), 50));
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getHotZones error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get incident status funnel
// @route   GET /api/analytics/status-funnel
// @access  Private - admin
const getStatusFunnel = async (req, res) => {
  try {
    const data = await Analytics.getStatusFunnel();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getStatusFunnel error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get priority distribution with resolution rates
// @route   GET /api/analytics/priority-distribution
// @access  Private - admin
const getPriorityDistribution = async (req, res) => {
  try {
    const data = await Analytics.getPriorityDistribution();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getPriorityDistribution error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get recurring incident patterns (predictive analytics input)
// @route   GET /api/analytics/recurring-patterns?minCount=2
// @access  Private - admin
const getRecurringPatterns = async (req, res) => {
  try {
    const { minCount = 2 } = req.query;
    const data = await Analytics.getRecurringPatterns(Math.max(parseInt(minCount), 2));
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getRecurringPatterns error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get category performance (used as AI module data source)
// @route   GET /api/analytics/category-performance
// @access  Private - admin
const getCategoryPerformance = async (req, res) => {
  try {
    const data = await Analytics.getCategoryPerformance();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getCategoryPerformance error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getResolutionTimes,
  getMonthlyVolume,
  getHotZones,
  getStatusFunnel,
  getPriorityDistribution,
  getRecurringPatterns,
  getCategoryPerformance,
};
