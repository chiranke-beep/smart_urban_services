const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// ── Helper: sign a JWT ───────────────────────────────────────────────────────
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ── Helper: send token response ──────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user.id, user.role);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profile_picture: user.profile_picture,
      home_address: user.home_address,
      saved_lat: user.saved_lat,
      saved_lng: user.saved_lng,
      created_at: user.created_at,
    },
  });
};

// ── @desc    Register a new user
// ── @route   POST /api/auth/register
// ── @access  Public
const register = async (req, res) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, role, phone, locality, district } = req.body;

  try {
    // Prevent duplicate emails
    if (await User.emailExists(email)) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Prevent self-assigning admin role via public registration
    const allowedRoles = ['citizen', 'service_provider'];
    const assignedRole = allowedRoles.includes(role) ? role : 'citizen';

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      phone: phone || null,
      locality: locality || (assignedRole === 'service_provider' ? 'Colombo' : 'Colombo Urban'),
      district: district || 'Colombo',
    });

    if (assignedRole === 'service_provider') {
      try {
        const pool = require('../config/database');
        await pool.query(`
          INSERT INTO provider_profiles (user_id, trade, daily_rate, hourly_rate, experience_years, verified, verification_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id) DO NOTHING
        `, [user.id, req.body.trade || 'Technician & Craftsman', 3500, 600, 5, false, 'PENDING']);
      } catch (e) {
        console.warn('Initial provider profile creation notice:', e.message);
      }
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ── @desc    Login user
// ── @route   POST /api/auth/login
// ── @access  Public
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Fetch user including password hash
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check account status
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Contact support.',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ── @desc    Get currently logged-in user
// ── @route   GET /api/auth/me
// ── @access  Private (requires JWT)
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe };
