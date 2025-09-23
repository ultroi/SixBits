const express = require('express');
global.express = express;
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
global.mongoose = mongoose;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const bcrypt = require('bcryptjs');
global.bcrypt = bcrypt;

const jwt = require('jsonwebtoken');
global.jwt = jwt;

const genAI = require('@google/generative-ai');
global.genAI = genAI;

// Prevent mongoose from buffering model operations on disconnected instances
mongoose.set('bufferCommands', false);

// Connection event listeners for debugging
mongoose.connection.on('connecting', () => console.log('[Frontend Backend DB] connecting...'));
mongoose.connection.on('connected', () => console.log('[Frontend Backend DB] connected'));
mongoose.connection.on('reconnected', () => console.log('[Frontend Backend DB] reconnected'));
mongoose.connection.on('disconnected', () => console.log('[Frontend Backend DB] disconnected'));
mongoose.connection.on('error', (err) => console.error('[Frontend Backend DB] error event:', err && err.message));

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const quizRoutes = require('./routes/quiz');
const collegeRoutes = require('./routes/college');
const courseRoutes = require('./routes/course');
const timelineRoutes = require('./routes/timeline');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/timeline', timelineRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Zariya API is running...');
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'Zariya',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      bufferCommands: false
    });
    
    console.log('Connected to MongoDB');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Handle server shutdown - close MongoDB connection
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('Server startup error:');
    console.error(err);
    process.exit(1);
  }
}

// Start the server
startServer();