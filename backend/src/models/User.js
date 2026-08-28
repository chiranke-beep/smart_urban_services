const pool = require('../config/database');

/**
 * User Model — raw SQL queries against PostgreSQL
 * Roles: citizen | service_provider | admin
 */

const User = {
  // ── Create the users table if it doesn't exist ──────────────────────────
  async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100)  NOT NULL,
        email       VARCHAR(150)  NOT NULL UNIQUE,
        password    VARCHAR(255)  NOT NULL,
        role        VARCHAR(20)   NOT NULL DEFAULT 'citizen'
                    CHECK (role IN ('citizen', 'service_provider', 'admin')),
        phone       VARCHAR(20),
        is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );

      -- Auto-update updated_at on row change
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS users_updated_at ON users;
      CREATE TRIGGER users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `;
    await pool.query(sql);
  },

  // ── Find by email or phone (used for login) ───────────────────────────
  async findByEmail(identifier) {
    const clean = (identifier || "").trim().toLowerCase();
    const rawDigits = clean.replace(/\D/g, "");

    const { rows } = await pool.query(
      `SELECT * FROM users 
       WHERE LOWER(TRIM(email)) = $1 
          OR LOWER(TRIM(phone)) = $1
          OR ($2 <> '' AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $2)
          OR ($2 <> '' AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE '%' || $2)
       LIMIT 1`,
      [clean, rawDigits]
    );
    return rows[0] || null;
  },

  // ── Find by id (used for JWT validation & auth/me) ──────────────────────
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.phone, u.is_active, u.created_at,
        u.locality, u.district, u.saved_lat, u.saved_lng, u.profile_picture,
        u.birthday, u.gender, u.language, u.home_address,
        pp.trade, pp.experience_years, pp.daily_rate, pp.hourly_rate,
        pp.vehicle_type, pp.plate_number, COALESCE(pp.verified, false) AS verified,
        COALESCE(pp.verification_status, 'PENDING') AS verification_status,
        pp.nic_number, pp.rejection_reason, COALESCE(pp.rating, 5.0) AS rating,
        COALESCE(pp.review_count, 0) AS review_count
       FROM users u
       LEFT JOIN provider_profiles pp ON u.id = pp.user_id
       WHERE u.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  // ── Create a new user ────────────────────────────────────────────────────
  async create({ name, email, password, role = 'citizen', phone = null, locality = 'Colombo', district = 'Colombo' }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, locality, district)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, phone, locality, district, is_active, created_at`,
      [name, email, password, role, phone, locality, district]
    );
    return rows[0];
  },

  // ── Check if email already exists ────────────────────────────────────────
  async emailExists(email) {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return rows.length > 0;
  },
};

module.exports = User;
