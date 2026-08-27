const express = require('express');
const { body } = require('express-validator');
const {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  updateIncidentStatus,
  deleteIncident,
  getStats,
} = require('../controllers/incidentsController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const upload = require('../config/upload');

const router = express.Router();

// Allow optional auth for incident viewing and creation
router.use(optionalAuth);

// ── Validation ────────────────────────────────────────────────────────────────

const createValidation = [
  body('title')
    .trim().notEmpty().withMessage('Title is required.')
    .isLength({ max: 200 }).withMessage('Title must be under 200 characters.'),

  body('description')
    .trim().notEmpty().withMessage('Description is required.'),

  body('category')
    .notEmpty().withMessage('Category is required.'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority.'),

  body('location_text')
    .trim().notEmpty().withMessage('Location description is required.'),

  body('latitude')
    .optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude.'),

  body('longitude')
    .optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude.'),
];

const updateValidation = [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().notEmpty(),
  body('category').optional().isIn(['road', 'water', 'electricity', 'waste', 'public_safety', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('location_text').optional().trim().notEmpty(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// GET  /api/incidents/stats    → summary stats (admin only) — must be before /:id
router.get('/stats', authorize('admin'), getStats);

// GET  /api/incidents          → list (role-filtered)
router.get('/', getAllIncidents);

// POST /api/incidents          → create new incident (with optional image)
router.post('/', upload.single('image'), createValidation, createIncident);

// GET  /api/incidents/:id      → get single incident
router.get('/:id', getIncidentById);

// PUT  /api/incidents/:id      → update incident details
router.put('/:id', upload.single('image'), updateValidation, updateIncident);

// PATCH /api/incidents/:id/status → update status (admin, service_provider, citizen)
router.patch(
  '/:id/status',
  updateIncidentStatus
);

// DELETE /api/incidents/:id    → delete incident
router.delete('/:id', deleteIncident);

module.exports = router;
