const express = global.express;
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// All chat routes are protected
router.use(auth);

// Process a message
router.post('/', chatController.processMessage);

// Get chat history
router.get('/history', chatController.getChatHistory);

module.exports = router;
