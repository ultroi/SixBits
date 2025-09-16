const express = global.express;
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);
router.get('/:id/careers', courseController.getCareerPaths);

module.exports = router;