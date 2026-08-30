const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function runMigrations() {
  try {
    console.log('Running user profile & location migrations...');

    // 1. Add profile fields to users table
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS home_address VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS saved_lat NUMERIC DEFAULT 7.264242;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS saved_lng NUMERIC DEFAULT 80.621701;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS locality TEXT DEFAULT 'Colombo';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS district TEXT DEFAULT 'Colombo';
    `);

    // 2. Ensure provider_profiles table has NIC and document columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS provider_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trade TEXT DEFAULT 'Technician & Craftsman',
        daily_rate NUMERIC DEFAULT 3500,
        hourly_rate NUMERIC DEFAULT 600,
        experience_years INTEGER DEFAULT 5,
        nic_number VARCHAR(30),
        nic_document_url TEXT,
        verified BOOLEAN DEFAULT FALSE,
        rating NUMERIC DEFAULT 5.0,
        review_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS nic_number VARCHAR(30);
      ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS nic_document_url TEXT;
    `);

    // 3. Ensure admin user exists with proper password
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    await pool.query(`
      INSERT INTO users (name, email, password, role, is_active)
      VALUES ('System Admin', 'admin@smarturban.lk', $1, 'admin', true)
      ON CONFLICT (email) DO NOTHING;
    `, [adminPassword]);

    console.log('All migrations executed successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
  }
}

if (require.main === module) {
  runMigrations().then(() => pool.end());
}

module.exports = runMigrations;
