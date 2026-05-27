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

function getGravatarUrl(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return '';
  }

  const emailHash = crypto.createHash('md5').update(normalizedEmail).digest('hex');
  return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=200`;
}

function buildUserResponse(user) {
  if (!user) return null;

  const userObject = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  return {
    ...userObject,
    avatarUrl: getGravatarUrl(userObject.email)
  };
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
      password
    } = req.body;

    const normalizedLastName = typeof lastName === 'string' ? lastName.trim() : '';

    const normalizedEmail = email && email.toLowerCase().trim();

    if (!firstName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'First name, email and password are required' });
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
      lastName: normalizedLastName,
      email: normalizedEmail,
      passwordHash,
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
      email: user.email,
      class: user.class,
      currentStatus: user.currentStatus,
      stream: user.stream,
      preferredLanguage: user.preferredLanguage,
      location: user.location,
      academicInterests: user.academicInterests,
      activities: user.activities,
      careerAspirations: user.careerAspirations,
      workStylePreference: user.workStylePreference,
      learningStyle: user.learningStyle,
      careerPriorities: user.careerPriorities,
      careerGoal: user.careerGoal,
      age: user.age,
      gender: user.gender,
      profileCompletion: calculateProfileCompletion(user),
      avatarUrl: getGravatarUrl(user.email)
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
      lastName: pendingSignup.lastName || '',
      email: pendingSignup.email,
      password: pendingSignup.passwordHash
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
// Calculate profile completion percentage
function calculateProfileCompletion(user) {
  const profileFields = [
    { name: 'firstName', required: true },
    { name: 'lastName', required: true },
    { name: 'age', required: true },
    { name: 'gender', required: true },
    { name: 'currentStatus', required: true },
    { name: 'class', required: true },
    { name: 'stream', required: true },
    { name: 'academicInterests', required: true, isArray: true },
    { name: 'activities', required: true, isArray: true },
    { name: 'careerAspirations', required: true, isArray: true },
    { name: 'workStylePreference', required: false },
    { name: 'learningStyle', required: false },
    { name: 'careerPriorities', required: false, isArray: true },
    { name: 'careerGoal', required: false },
    { name: 'location', required: false, isNested: true },
    { name: 'quizResults', required: false, isArray: true }
  ];

  let filledCount = 0;
  let totalRequired = 0;

  profileFields.forEach(field => {
    const value = field.isNested ? (user[field.name] && (user[field.name].city || user[field.name].state)) : user[field.name];
    
    // Check if field is filled
    const isFilled = 
      value !== null && 
      value !== undefined && 
      value !== '' && 
      (field.isArray ? (Array.isArray(value) && value.length > 0) : true);

    if (field.required) {
      totalRequired++;
      if (isFilled) filledCount++;
    } else {
      // Optional fields add to total but not required
      totalRequired++;
      if (isFilled) filledCount++;
    }
  });

  // Calculate percentage (ensure minimum 5% and maximum 100%)
  const percentage = totalRequired > 0 ? Math.ceil((filledCount / totalRequired) * 100) : 0;
  return Math.min(Math.max(percentage, 5), 100);
}

exports.getCurrentUser = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendDbUnavailable(res);
    }

    const User = getUserModel();
    const user = await User.findById(req.user._id).select('-password');
    
    // Calculate and include profile completion
    const profileCompletion = calculateProfileCompletion(user);
    const userResponse = buildUserResponse(user);
    userResponse.profileCompletion = profileCompletion;
    
    res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendDbUnavailable(res);
    }

    const User = getUserModel();
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      fullName,
      firstName,
      lastName,
      class: userClass,
      currentStatus,
      stream,
      preferredLanguage,
      city,
      state,
      location,
      academicInterests,
      activities,
      careerAspirations,
      workStylePreference,
      learningStyle,
      careerPriorities,
      careerGoal
    } = req.body;

    if (typeof fullName === 'string' && fullName.trim()) {
      const nameParts = fullName.trim().split(/\s+/);
      user.firstName = nameParts.shift() || user.firstName;
      user.lastName = nameParts.join(' ') || user.lastName;
    } else {
      if (typeof firstName === 'string' && firstName.trim()) {
        user.firstName = firstName.trim();
      }

      if (typeof lastName === 'string' && lastName.trim()) {
        user.lastName = lastName.trim();
      }
    }

    if (typeof userClass === 'string' && userClass) {
      user.class = userClass;
    }

    if (typeof currentStatus === 'string' && currentStatus) {
      user.currentStatus = currentStatus;
    }

    if (typeof stream === 'string' && stream) {
      user.stream = stream;
    }

    if (typeof preferredLanguage === 'string' && preferredLanguage) {
      user.preferredLanguage = preferredLanguage;
    }

    if (Array.isArray(academicInterests)) {
      user.academicInterests = academicInterests.map((item) => String(item).trim()).filter(Boolean);
    }

    if (Array.isArray(activities)) {
      user.activities = activities.map((item) => String(item).trim()).filter(Boolean);
    }

    if (Array.isArray(careerAspirations)) {
      user.careerAspirations = careerAspirations.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof workStylePreference === 'string') {
      user.workStylePreference = workStylePreference.trim();
    }

    if (typeof learningStyle === 'string') {
      user.learningStyle = learningStyle.trim();
    }

    if (Array.isArray(careerPriorities)) {
      user.careerPriorities = careerPriorities.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof careerGoal === 'string') {
      user.careerGoal = careerGoal.trim();
    }

    const nextCity = typeof city === 'string'
      ? city.trim()
      : typeof location?.city === 'string'
        ? location.city.trim()
        : typeof user.location?.city === 'string'
          ? user.location.city
          : '';

    const nextState = typeof state === 'string'
      ? state.trim()
      : typeof location?.state === 'string'
        ? location.state.trim()
        : typeof user.location?.state === 'string'
          ? user.location.state
          : '';

    const nextCoordinates = Array.isArray(location?.coordinates) && location.coordinates.length === 2
      ? location.coordinates
      : Array.isArray(user.location?.coordinates?.coordinates) && user.location.coordinates.coordinates.length === 2
        ? user.location.coordinates.coordinates
        : null;

    if (nextCity || nextState || nextCoordinates) {
      if (!user.location) {
        user.location = {};
      }

      if (nextCity) {
        user.location.city = nextCity;
      }

      if (nextState) {
        user.location.state = nextState;
      }

      if (nextCoordinates) {
        user.location.coordinates = {
          type: 'Point',
          coordinates: nextCoordinates
        };
      }
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: buildUserResponse(updatedUser)
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.changeEmail = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendDbUnavailable(res);
    }

    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ message: 'New email and current password are required' });
    }

    const normalizedEmail = String(newEmail).toLowerCase().trim();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email' });
    }

    const User = getUserModel();
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (user.email === normalizedEmail) {
      return res.status(400).json({ message: 'New email must be different from current email' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use by another account' });
    }

    user.email = normalizedEmail;
    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    return res.status(200).json({
      message: 'Email updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Change email error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return sendDbUnavailable(res);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const User = getUserModel();
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error' });
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
