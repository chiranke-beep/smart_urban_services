const express = require('express');
const {
  getResolutionTimes,
  getMonthlyVolume,
  getHotZones,
  getStatusFunnel,
  getPriorityDistribution,
  getRecurringPatterns,
  getCategoryPerformance,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All analytics routes - admin only
router.use(protect, authorize('admin'));

// GET /api/analytics/resolution-times       -> avg resolution time per category
router.get('/resolution-times', getResolutionTimes);

// GET /api/analytics/monthly-volume         -> monthly incident trend
router.get('/monthly-volume', getMonthlyVolume);

// GET /api/analytics/hot-zones              -> geographic high-frequency areas
router.get('/hot-zones', getHotZones);

// GET /api/analytics/status-funnel          -> status progression breakdown
router.get('/status-funnel', getStatusFunnel);

// GET /api/analytics/priority-distribution  -> priority vs resolution stats
router.get('/priority-distribution', getPriorityDistribution);

// GET /api/analytics/recurring-patterns     -> AI predictive input data
router.get('/recurring-patterns', getRecurringPatterns);

// GET /api/analytics/category-performance   -> full category report for AI
router.get('/category-performance', getCategoryPerformance);

module.exports = router;
