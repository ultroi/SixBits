const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

router.get('/', quizController.getQuizzes);
router.get('/:id', quizController.getQuizById);
router.post('/submit', quizController.submitQuiz);
router.get('/generate/:userId', quizController.generatePersonalizedQuiz);
router.get('/results/:userId', quizController.getUserQuizResults);

module.exports = router;