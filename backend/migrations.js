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
        vehicle_type TEXT DEFAULT 'Professional Tools',
        plate_number VARCHAR(50) DEFAULT 'WP-CAB-8821',
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
      ON CONFLICT (email) DO UPDATE SET password = $1, role = 'admin';
    `, [adminPassword]);
    console.log('✅ Admin user verified: admin@smarturban.lk / Admin@123');

    // 4. Ensure demo citizen user exists
    const citizenPassword = await bcrypt.hash('Citizen@123', 10);
    await pool.query(`
      INSERT INTO users (name, email, password, role, is_active, phone, locality, district)
      VALUES ('Chiran Weerasekara', 'chiran@gmail.com', $1, 'citizen', true, '0771234567', 'Heerassagala', 'Kandy')
      ON CONFLICT (email) DO UPDATE SET password = $1, role = 'citizen';
    `, [citizenPassword]);
    console.log('✅ Citizen user verified: chiran@gmail.com / Citizen@123');

    // 5. Ensure demo provider exists
    const providerPassword = await bcrypt.hash('Provider@123', 10);
    const providerResult = await pool.query(`
      INSERT INTO users (name, email, password, role, is_active, phone, locality, district)
      VALUES ('Kasun Perera', 'kasun@worker.lk', $1, 'service_provider', true, '0719876543', 'Kandy Central', 'Kandy')
      ON CONFLICT (email) DO UPDATE SET password = $1, role = 'service_provider'
      RETURNING id;
    `, [providerPassword]);

    if (providerResult.rows[0]) {
      await pool.query(`
        INSERT INTO provider_profiles (user_id, trade, daily_rate, hourly_rate, experience_years, verified, rating, review_count)
        VALUES ($1, 'Tree Cutting & Landscaping', 4500, 750, 8, true, 4.9, 24)
        ON CONFLICT (user_id) DO NOTHING;
      `, [providerResult.rows[0].id]);
    }
    console.log('✅ Provider user verified: kasun@worker.lk / Provider@123');

    console.log('All migrations and seeds executed successfully!');
  } catch (err) {
    console.error('Migration error:', err.message);
  }
}

if (require.main === module) {
  runMigrations().then(() => pool.end());
}

module.exports = runMigrations;
