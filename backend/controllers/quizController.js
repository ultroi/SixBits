const Quiz = require('../models/Quiz');
const User = require('../models/User');

// Get all active quizzes
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isActive: true });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get quiz by ID
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit quiz results
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, userId } = req.body;
    
    // Calculate score and analyze answers
    const quiz = await Quiz.findById(quizId);
    let score = 0;
    const interests = [];
    const strengths = [];
    const personalityTraits = [];
    
    answers.forEach((answer, index) => {
      if (answer === quiz.questions[index].correctAnswer) score++;
      
      // Categorize based on question category
      const category = quiz.questions[index].category;
      if (category === 'interest') interests.push(quiz.questions[index].options[answer]);
      else if (category === 'strength') strengths.push(quiz.questions[index].options[answer]);
      else if (category === 'personality') personalityTraits.push(quiz.questions[index].options[answer]);
    });
    
    // Determine suggested streams based on results
    const suggestedStreams = [];
    if (interests.includes('Science') || strengths.includes('Analytical')) suggestedStreams.push('Science');
    if (interests.includes('Arts') || personalityTraits.includes('Creative')) suggestedStreams.push('Arts');
    if (interests.includes('Commerce') || strengths.includes('Business')) suggestedStreams.push('Commerce');
    
    // Save results to user
    const quizResult = {
      quizId,
      score,
      interests,
      strengths,
      personalityTraits,
      suggestedStreams
    };
    
    await User.findByIdAndUpdate(userId, { $push: { quizResults: quizResult } });
    
    res.json({ score, suggestedStreams, interests, strengths, personalityTraits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};