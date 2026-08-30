const express = require('express');
const {
  getDashboard,
  getIncidentsByCategory,
  getIncidentsTrend,
  getTopProviders,
  getRecentActivity,
  assignIncident,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require login and admin role
router.use(protect, authorize('admin'));

// GET /api/admin/dashboard                -> overview stats
router.get('/dashboard', getDashboard);

// GET /api/admin/incidents/by-category    -> incidents per category
router.get('/incidents/by-category', getIncidentsByCategory);

// GET /api/admin/incidents/trend?days=30  -> daily trend
router.get('/incidents/trend', getIncidentsTrend);

// GET /api/admin/providers/top            -> leaderboard
router.get('/providers/top', getTopProviders);

// GET /api/admin/activity                 -> recent activity feed
router.get('/activity', getRecentActivity);

// POST /api/admin/incidents/:id/assign    -> assign to provider
router.post('/incidents/:id/assign', assignIncident);

module.exports = router;
