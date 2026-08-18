const pool = require('../config/database');

/**
 * User Profile Model — extended queries for user management
 * Core user CRUD is handled here (auth model handles auth-specific queries)
 */

const UserProfile = {
  // ── Get all users (admin only) ───────────────────────────────────────────
  async findAll({ role, is_active, limit = 20, offset = 0 } = {}) {
    let conditions = [];
    let values = [];
    let idx = 1;

    if (role) {
      conditions.push(`role = $${idx++}`);
      values.push(role);
    }
    if (is_active !== undefined) {
      conditions.push(`is_active = $${idx++}`);
      values.push(is_active);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT id, name, email, role, phone, is_active, created_at, updated_at
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users ${where}`,
      values.slice(0, -2)
    );

    return {
      users: rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit,
      offset,
    };
  },

  // ── Get single user by id ────────────────────────────────────────────────
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, phone, is_active, created_at, updated_at
       FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  // ── Update user profile (name, phone) ───────────────────────────────────
  async updateProfile(id, { name, phone }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }

    if (fields.length === 0) return null;

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING id, name, email, role, phone, is_active, updated_at`,
      values
    );
    return rows[0] || null;
  },

  // ── Change user role (admin only) ────────────────────────────────────────
  async updateRole(id, role) {
    const { rows } = await pool.query(
      `UPDATE users SET role = $1
       WHERE id = $2
       RETURNING id, name, email, role, updated_at`,
      [role, id]
    );
    return rows[0] || null;
  },

  // ── Deactivate / reactivate user (admin only) ────────────────────────────
  async setActiveStatus(id, is_active) {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = $1
       WHERE id = $2
       RETURNING id, name, email, role, is_active, updated_at`,
      [is_active, id]
    );
    return rows[0] || null;
  },
};

module.exports = UserProfile;
