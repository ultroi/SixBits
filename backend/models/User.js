const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    age: {
      type: Number,
      min: [10, 'Age must be at least 10'],
      max: [100, 'Age must be at most 100']
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    class: {
      type: String,
      enum: ['10th', '11th', '12th', 'Graduate', 'Post-Graduate', 'Other']
    },
    academicInterests: [{
      type: String,
      enum: ['Arts', 'Science', 'Commerce', 'Vocational', 'Engineering', 'Medical', 'Law', 'Business', 'Other']
    }],
    quizResults: [{
      quizId: { type: mongoose.Schema.Types.Mixed, ref: 'Quiz' },
      score: Number,
      interests: [String],
      strengths: [String],
      personalityTraits: [String],
      suggestedStreams: [String],
      dateTaken: { type: Date, default: Date.now }
    }],
    location: {
      city: String,
      state: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number],
          default: [0, 0]
        }
      }
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving to database
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
