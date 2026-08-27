const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Validation rules ─────────────────────────────────────────────────────────

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),

  body('role')
    .optional()
    .isIn(['citizen', 'service_provider']).withMessage("Role must be 'citizen' or 'service_provider'."),

  body('phone')
    .optional()
    .custom((val) => !val || (typeof val === 'string' && val.replace(/\D/g, '').length >= 9))
    .withMessage('Please provide a valid phone number with at least 9 digits.'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email or phone number is required.'),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// GET /api/auth/me  (protected)
router.get('/me', protect, getMe);

module.exports = router;
