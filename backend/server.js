require('dotenv').config();
const pool = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Test DB connection then start server
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
  release();
  console.log('✅ Database connected:', process.env.DB_NAME);
  console.log(`🚀 Server ready on port ${PORT}`);
});
