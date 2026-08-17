const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  setUserStatus,
} = require('../controllers/usersController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Validation ────────────────────────────────────────────────────────────────

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty.')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters.'),

  body('phone')
    .optional()
    .isMobilePhone().withMessage('Please provide a valid phone number.'),
];

const updateRoleValidation = [
  body('role')
    .notEmpty().withMessage('Role is required.')
    .isIn(['citizen', 'service_provider', 'admin'])
    .withMessage("Role must be 'citizen', 'service_provider', or 'admin'."),
];

const statusValidation = [
  body('is_active')
    .notEmpty().withMessage('is_active is required.')
    .isBoolean().withMessage('is_active must be true or false.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// GET    /api/users              → list all users (admin only)
router.get('/', authorize('admin'), getAllUsers);

// GET    /api/users/:id          → get user profile (own or admin)
router.get('/:id', getUserById);

// PUT    /api/users/:id          → update name/phone (own or admin)
router.put('/:id', updateProfileValidation, updateUser);

// PUT    /api/users/:id/role     → change role (admin only)
router.put('/:id/role', authorize('admin'), updateRoleValidation, updateUserRole);

// PUT    /api/users/:id/status   → activate/deactivate (admin only)
router.put('/:id/status', authorize('admin'), statusValidation, setUserStatus);

module.exports = router;
