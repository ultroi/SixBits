const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Disable Mongoose buffering globally to prevent timeout errors
mongoose.set('bufferCommands', false);

// Import models
const User = require('../backend/models/User');
const Chat = require('../backend/models/Chat');
const College = require('../backend/models/College');
const Course = require('../backend/models/Course');
const Quiz = require('../backend/models/Quiz');
const Timeline = require('../backend/models/Timeline');

// Import routes
const authRoutes = require('../backend/routes/auth');
const chatRoutes = require('../backend/routes/chat');
const quizRoutes = require('../backend/routes/quiz');
const collegeRoutes = require('../backend/routes/college');
const courseRoutes = require('../backend/routes/course');
const timelineRoutes = require('../backend/routes/timeline');

// Import middleware
const auth = require('../backend/middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/timeline', timelineRoutes);

// Connect to MongoDB
let isConnected = false;

async function connectToDatabase() {
  // If Mongoose already has an established connection, reuse it (Vercel serverless optimization)
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'Zariya',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:');
    console.error(error);
    throw error;
  }
}

// Middleware to connect to DB
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ message: 'Database connection error' });
  }
});

// Export the Express app as a Vercel serverless function
module.exports = app;

// For local development
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}