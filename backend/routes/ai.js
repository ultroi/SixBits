const express = global.express;
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /api/ai/career-matches
router.post('/career-matches', aiController.getCareerMatches);

module.exports = router;
