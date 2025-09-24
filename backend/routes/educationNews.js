const express = global.express;
const router = express.Router();
const educationNewsController = require('../controllers/educationNewsController');

// Route to get education news
router.get('/', educationNewsController.getEducationNews);

module.exports = router;