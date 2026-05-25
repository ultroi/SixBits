const mongoose = global.mongoose;

const pendingSignupSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    age: Number,
    gender: String,
    class: String,
    stream: String,
    academicInterests: [String],
    preferredLanguage: {
      type: String,
      default: 'english'
    },
    location: {
      city: String,
      state: String
    },
    otpHash: {
      type: String,
      required: true
    },
    otpExpiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

pendingSignupSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

const PendingSignup = mongoose.model('PendingSignup', pendingSignupSchema);

module.exports = PendingSignup;