const express = global.express;
const router = express.Router();
const courseController = require('../controllers/courseController');
const auth = require('../middleware/auth');

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);
router.get('/:id/careers', courseController.getCareerPaths);
router.post('/suggestions', auth, courseController.getCourseSuggestions);

module.exports = router;