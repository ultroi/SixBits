const jwt = global.jwt;
const mongoose = global.mongoose;
const bcrypt = global.bcrypt;
const crypto = require('crypto');

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  nodemailer = null;
}

function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function sendDbUnavailable(res) {
  return res.status(503).json({
    message: 'Database unavailable. Please configure a valid MongoDB connection and try again.'
  });
}

function getFrontendUrl(req) {
  const configuredUrl = process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  const requestOrigin = req && typeof req.get === 'function' && req.get('origin');
  if (requestOrigin) {
    return requestOrigin.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    return '';
  }

  return 'http://localhost:3000';
}

function getMailerTransport() {
  if (!nodemailer) {
    return null;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user,
      pass
    }
  });
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

async function sendVerificationOtpEmail(email, otp) {
  const transporter = getMailerTransport();

  if (!transporter) {
    console.warn('[Auth] SMTP not configured; verification OTP for', email, 'is', otp);
    return false;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Verify your Zariya account',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Verify your email</h2>
        <p>Your OTP for Zariya account verification is:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `
  });

  return true;
}

async function createOrUpdatePendingSignup(PendingSignup, email, payload) {
  return PendingSignup.findOneAndUpdate(
    { email },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

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

function getPendingSignupModel() {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      if (mongoose.connection.models && mongoose.connection.models.PendingSignup) {
        return mongoose.connection.model('PendingSignup');
      }

      const pendingSchema = require('../models/PendingSignup').schema || require('../models/PendingSignup');
      return mongoose.connection.model('PendingSignup', pendingSchema);
    }
  } catch (err) {
    console.error('[FrontendBackend] error getting PendingSignup model:', err && err.message);
  }

  return require('../models/PendingSignup');
}

// Register a new user
exports.register = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendDbUnavailable(res);
    }

    const User = getUserModel();
    const PendingSignup = getPendingSignupModel();
    const {
      firstName,
      lastName,
      email,
      password,
      age,
      gender,
      class: userClass,
      academicInterests,
      state,
      city,
      stream,
      preferredLanguage
    } = req.body;

    const normalizedEmail = email && email.toLowerCase().trim();

    if (!firstName || !lastName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'First name, last name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const otp = generateOtp();
    const otpHash = hashValue(otp);
    const passwordHash = await bcrypt.hash(password, 10);
    const otpExpiresAt = new Date(Date.now() + 1000 * 60 * 10);

    await createOrUpdatePendingSignup(PendingSignup, normalizedEmail, {
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      age,
      gender,
      class: userClass,
      academicInterests,
      stream,
      preferredLanguage,
      location: {
        city,
        state
      },
      otpHash,
      otpExpiresAt
    });

    const otpDelivered = await sendVerificationOtpEmail(normalizedEmail, otp);

    const responseBody = {
      message: 'OTP sent to your email. Please verify to create your account.',
      email: normalizedEmail
    };

    if (process.env.NODE_ENV !== 'production' && !otpDelivered) {
      responseBody.devOtp = otp;
    }

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendDbUnavailable(res);
    }

    const { email, password } = req.body;
    
    // Check if user exists
    const User = getUserModel();
    if (process.env.DEBUG_DB === '1') {
      console.log('[FrontendBackend Auth] mongoose readyState:', mongoose.connection.readyState);
      console.log('[FrontendBackend Auth] using User model from connection:', User && User.db && User.db.name);
    }

    const normalizedEmail = email && email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      const PendingSignup = getPendingSignupModel();
      const pendingSignup = await PendingSignup.findOne({ email: normalizedEmail });
      if (pendingSignup) {
        return res.status(400).json({ message: 'Please verify your email with the OTP first' });
      }

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

exports.verifySignupOtp = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendDbUnavailable(res);
    }

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const PendingSignup = getPendingSignupModel();
    const pendingSignup = await PendingSignup.findOne({ email: normalizedEmail });

    if (!pendingSignup) {
      return res.status(400).json({ message: 'OTP expired or signup request not found' });
    }

    if (pendingSignup.otpExpiresAt.getTime() < Date.now()) {
      await PendingSignup.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ message: 'OTP expired. Please sign up again.' });
    }

    if (pendingSignup.otpHash !== hashValue(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const User = getUserModel();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      await PendingSignup.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ message: 'Account already exists. Please log in.' });
    }

    const user = new User({
      firstName: pendingSignup.firstName,
      lastName: pendingSignup.lastName,
      email: pendingSignup.email,
      password: pendingSignup.passwordHash,
      age: pendingSignup.age,
      gender: pendingSignup.gender,
      class: pendingSignup.class,
      academicInterests: pendingSignup.academicInterests,
      stream: pendingSignup.stream,
      preferredLanguage: pendingSignup.preferredLanguage,
      location: pendingSignup.location
    });

    user._skipPasswordHash = true;
    await user.save();
    await PendingSignup.deleteOne({ email: normalizedEmail });

    return res.status(201).json({ message: 'Email verified successfully. Your account is now created.' });
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.resendSignupOtp = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendDbUnavailable(res);
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const PendingSignup = getPendingSignupModel();
    const pendingSignup = await PendingSignup.findOne({ email: normalizedEmail });

    if (!pendingSignup) {
      return res.status(404).json({ message: 'No pending signup found for this email' });
    }

    const otp = generateOtp();
    const otpHash = hashValue(otp);
    const otpExpiresAt = new Date(Date.now() + 1000 * 60 * 10);

    pendingSignup.otpHash = otpHash;
    pendingSignup.otpExpiresAt = otpExpiresAt;
    await pendingSignup.save();

    const otpDelivered = await sendVerificationOtpEmail(normalizedEmail, otp);

    const responseBody = {
      message: 'A new OTP has been sent to your email.'
    };

    if (process.env.NODE_ENV !== 'production' && !otpDelivered) {
      responseBody.devOtp = otp;
    }

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error('Resend signup OTP error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendDbUnavailable(res);
    }

    const User = getUserModel();
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendDbUnavailable(res);
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const User = getUserModel();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(200).json({
        message: 'If an account exists for this email, a reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save();

    const frontendUrl = getFrontendUrl(req);
    const resetUrl = frontendUrl
      ? `${frontendUrl}/reset-password/${resetToken}`
      : `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    const transporter = getMailerTransport();

    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Reset your Zariya password',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <h2>Password reset request</h2>
            <p>We received a request to reset your password for Zariya.</p>
            <p><a href="${resetUrl}" target="_blank" rel="noreferrer">Click here to reset your password</a></p>
            <p>This link expires in 30 minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
          </div>
        `
      });
    } else {
      console.warn('[Auth] SMTP not configured; reset link:', resetUrl);
    }

    const responseBody = {
      message: 'If an account exists for this email, a reset link has been sent.'
    };

    if (process.env.NODE_ENV !== 'production') {
      responseBody.resetUrl = resetUrl;
    }

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendDbUnavailable(res);
    }

    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const User = getUserModel();
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
