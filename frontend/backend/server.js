const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

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
      dbName: 'Zariya'
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
    console.error('Server startup error:', err);
  }
}

// Start the server
startServer();