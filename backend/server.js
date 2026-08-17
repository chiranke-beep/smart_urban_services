require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');

const pool = require('./src/config/database');
const User = require('./src/models/User');

// ── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./src/routes/auth');

// ── App & HTTP server ────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Attach io instance to app for use in controllers
app.set('io', io);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart Urban Services API is running 🚀', env: process.env.NODE_ENV });
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test DB connection
    const client = await pool.connect();
    client.release();
    console.log(`✅ Database connected: ${process.env.DB_NAME}`);

    // Run table migrations
    await User.createTable();
    console.log('✅ Users table ready');

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
