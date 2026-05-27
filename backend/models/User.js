const mongoose = global.mongoose;
const bcrypt = global.bcrypt;

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      default: '',
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
    passwordResetToken: {
      type: String,
      default: null
    },
    passwordResetExpires: {
      type: Date,
      default: null
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
    currentStatus: {
      type: String,
      default: 'School Student',
      enum: ['School Student', 'College Student', 'Working Professional', 'Career Switcher']
    },
    stream: {
      type: String,
      enum: ['Arts', 'Science', 'Commerce', 'Vocational', 'Engineering', 'Medical', 'Law', 'Business', 'Other']
    },
    academicInterests: [{
      type: String,
      trim: true,
      default: ''
    }],
    activities: [{
      type: String,
      trim: true,
      default: ''
    }],
    careerAspirations: [{
      type: String,
      trim: true,
      default: ''
    }],
    workStylePreference: {
      type: String,
      trim: true,
      default: ''
    },
    learningStyle: {
      type: String,
      trim: true,
      default: ''
    },
    careerPriorities: [{
      type: String,
      trim: true,
      default: ''
    }],
    careerGoal: {
      type: String,
      trim: true,
      default: ''
    },
    preferredLanguage: {
      type: String,
      enum: ['hindi', 'english'],
      default: 'english'
    },
    quizResults: [{
      quizId: { type: mongoose.Schema.Types.Mixed, ref: 'Quiz' },
      score: Number,
      interests: [String],
      strengths: [String],
      personalityTraits: [String],
      suggestedStreams: [String],
      detailedAnswers: [{
        questionIndex: Number,
        question: String,
        selectedAnswer: Number,
        answerText: String,
        category: String
      }],
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
  if (this._skipPasswordHash) return next();

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

const User = mongoose.model('User', userSchema);

module.exports = User;
