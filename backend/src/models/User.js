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

  // ── Find by email (used for login) ──────────────────────────────────────
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  // ── Find by id (used for JWT validation) ────────────────────────────────
  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  // ── Create a new user ────────────────────────────────────────────────────
  async create({ name, email, password, role = 'citizen', phone = null }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, phone, is_active, created_at`,
      [name, email, password, role, phone]
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
