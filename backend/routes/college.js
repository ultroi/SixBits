const express = global.express;
const router = express.Router();
const collegeController = require('../controllers/collegeController');

router.get('/', collegeController.getColleges);
router.get('/nearby', collegeController.getCollegesByLocation);
router.get('/:id', collegeController.getCollegeById);

module.exports = router;