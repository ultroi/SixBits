const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables early
dotenv.config();

// Basic env var validation (don't crash – respond with clear error later)
const REQUIRED_ENV_VARS = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missing.length) {
  console.warn('[Startup] Missing environment variables:', missing.join(', '));
}

// Disable Mongoose buffering globally to prevent long timeouts when disconnected
mongoose.set('bufferCommands', false);

try {
  require('../../backend/models/User');
  require('../../backend/models/Chat');
  require('../../backend/models/College');
  require('../../backend/models/Course');
  require('../../backend/models/Quiz');
  require('../../backend/models/Timeline');
  console.log('[Models] Successfully loaded all models');
} catch (err) {
  console.error('[Models] Failed to load models:', err.message);
  if (err.code === 'MODULE_NOT_FOUND') {
    console.error('[Models] This could be due to missing dependencies in your deployment.');
    console.error('[Models] Make sure mongoose and other required packages are installed.');
    console.error('[Models] Path resolution issue:', err.path || 'unknown');
  }
  throw err; // Rethrow to ensure the app doesn't start with missing models
}

// Import routes
const authRoutes = require('../../backend/routes/auth');
const chatRoutes = require('../../backend/routes/chat');
const quizRoutes = require('../../backend/routes/quiz');
const collegeRoutes = require('../../backend/routes/college');
const courseRoutes = require('../../backend/routes/course');
const timelineRoutes = require('../../backend/routes/timeline');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());

// --- Mongo Connection Management ---
let connectionPromise = null; // Promise reference to avoid race conditions

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection; // already connected
  if (mongoose.connection.readyState === 2) return connectionPromise; // connecting

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not set');
  }

  if (!connectionPromise) {
    console.log('[DB] Initiating new MongoDB connection...');
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI, {
        dbName: 'Zariya',
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        bufferCommands: false
      })
      .then(conn => {
        console.log('[DB] Connected to MongoDB');
        return conn;
      })
      .catch(err => {
        console.error('[DB] Connection error:', err.message);
        // Reset promise so future attempts can retry
        connectionPromise = null;
        throw err;
      });
  }
  return connectionPromise;
}

// Pre-route middleware: ensure DB connection before hitting any route handlers
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    return next();
  } catch (err) {
    if (err.message === 'MONGODB_URI not set') {
      return res.status(500).json({ message: 'Server misconfiguration: database URI missing' });
    }
    return res.status(503).json({ message: 'Database unavailable. Please retry.' });
  }
});

// Routes (after DB connection guard)
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/timeline', timelineRoutes);

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbState: mongoose.connection.readyState,
    uptime: process.uptime()
  });
});

if (process.env.DEBUG_DB === '1') {
  app.get('/api/health/db', (req, res) => {
    const conn = mongoose.connection;
    let uriSafe = process.env.MONGODB_URI || '';
    if (uriSafe.includes('@')) {
      // Mask credentials before '@'
      uriSafe = uriSafe.replace(/:\/\/.+@/, '://***@');
    }
    res.json({
      state: conn.readyState,
      host: conn.host,
      name: conn.name,
      user: conn.user || null,
      debug: true,
      uriPresent: !!process.env.MONGODB_URI,
      uriSample: uriSafe.slice(0, 60) + (uriSafe.length > 60 ? '...' : ''),
      pid: process.pid,
      memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    });
  });
}

// Attempt eager connection on cold start (non-blocking)
connectToDatabase().catch(() => {});

// Connection event listeners (registered once)
mongoose.connection.on('connecting', () => console.log('[DB] connecting...'));
mongoose.connection.on('connected', () => console.log('[DB] connected'));
mongoose.connection.on('reconnected', () => console.log('[DB] reconnected'));
mongoose.connection.on('disconnected', () => console.log('[DB] disconnected'));
mongoose.connection.on('error', (err) => console.error('[DB] connection error event:', err.message));

// Export the Express app as a Vercel serverless function
module.exports = app;

// Local development (optional): run standalone if invoked directly
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}