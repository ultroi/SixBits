const jwt = global.jwt;
const mongoose = global.mongoose;

// Helper to get User model bound to the active mongoose connection
function getUserModel() {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      // If model already registered on this connection, return it
      if (mongoose.connection.models && mongoose.connection.models.User) {
        return mongoose.connection.model('User');
      }
      // Otherwise require the schema and compile on this connection
      const userSchema = require('../models/User').schema || require('../models/User');
      return mongoose.connection.model('User', userSchema);
    }
  } catch (err) {
    console.error('[FrontendBackend] error getting User model from active connection:', err && err.message);
  }

  // Fallback to module-level require (may be bound to another mongoose instance)
  try {
    return require('../models/User');
  } catch (e) {
    throw e;
  }
}

// Register a new user
exports.register = async (req, res) => {
  try {
    const User = getUserModel();
    const { firstName, lastName, email, password, age, gender, class: userClass, academicInterests, state, city } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      age,
      gender,
      class: userClass,
      academicInterests,
      location: {
        city,
        state
      }
    });
    
    await user.save();
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const User = getUserModel();
    if (process.env.DEBUG_DB === '1') {
      console.log('[FrontendBackend Auth] mongoose readyState:', mongoose.connection.readyState);
      console.log('[FrontendBackend Auth] using User model from connection:', User && User.db && User.db.name);
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Create JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    // User object to return (without password)
    const userToReturn = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    };
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userToReturn
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const User = getUserModel();
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
