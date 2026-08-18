const { validationResult } = require('express-validator');
const UserProfile = require('../models/UserProfile');

// ── @desc    Get all users (with optional filters)
// ── @route   GET /api/users
// ── @access  Private — admin only
const getAllUsers = async (req, res) => {
  try {
    const { role, is_active, limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await UserProfile.findAll({
      role,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      limit: parseInt(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: result.users,
    });
  } catch (err) {
    console.error('getAllUsers error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @desc    Get single user by ID
// ── @route   GET /api/users/:id
// ── @access  Private — own profile or admin
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow users to see their own profile, unless admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.',
      });
    }

    const user = await UserProfile.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('getUserById error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @desc    Update own profile (name, phone)
// ── @route   PUT /api/users/:id
// ── @access  Private — own profile or admin
const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { id } = req.params;

    // Users can only update their own profile
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.',
      });
    }

    const target = await UserProfile.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { name, phone } = req.body;
    const updated = await UserProfile.updateProfile(id, { name, phone });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('updateUser error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @desc    Change a user's role
// ── @route   PUT /api/users/:id/role
// ── @access  Private — admin only
const updateUserRole = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent admin from changing their own role
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.',
      });
    }

    const target = await UserProfile.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updated = await UserProfile.updateRole(id, role);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('updateUserRole error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── @desc    Deactivate or reactivate a user account
// ── @route   DELETE /api/users/:id   (deactivate)
// ── @route   PUT /api/users/:id/status
// ── @access  Private — admin only
const setUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    const target = await UserProfile.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updated = await UserProfile.setActiveStatus(id, is_active);
    res.status(200).json({
      success: true,
      message: `User account ${is_active ? 'activated' : 'deactivated'} successfully.`,
      data: updated,
    });
  } catch (err) {
    console.error('setUserStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, updateUserRole, setUserStatus };
