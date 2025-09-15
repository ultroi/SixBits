const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../../backend/models/User');
const Chat = require('../../backend/models/Chat');
const College = require('../../backend/models/College');
const Course = require('../../backend/models/Course');
const Quiz = require('../../backend/models/Quiz');
const Timeline = require('../../backend/models/Timeline');

// Import routes
const authRoutes = require('../../backend/routes/auth');
const chatRoutes = require('../../backend/routes/chat');
const quizRoutes = require('../../backend/routes/quiz');
const collegeRoutes = require('../../backend/routes/college');
const courseRoutes = require('../../backend/routes/course');
const timelineRoutes = require('../../backend/routes/timeline');

// Import middleware
const auth = require('../../backend/middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/quiz', quizRoutes);
app.use('/colleges', collegeRoutes);
app.use('/courses', courseRoutes);
app.use('/timeline', timelineRoutes);

// Connect to MongoDB
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'Zariya'
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Export the Express app as a Vercel serverless function
module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// For local development
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}