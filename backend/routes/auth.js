const express = global.express;
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/verify-signup-otp', authController.verifySignupOtp);
router.post('/resend-signup-otp', authController.resendSignupOtp);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', auth, authController.getCurrentUser);
router.patch('/me', auth, authController.updateCurrentUser);
router.patch('/me/email', auth, authController.changeEmail);
router.patch('/me/password', auth, authController.changePassword);

module.exports = router;
