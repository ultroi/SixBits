const Quiz = require('../models/Quiz');
const User = require('../models/User');
const aiService = require('../services/aiService');

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
    
    // Validate required fields
    if (!userId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid quiz submission data' });
    }
    
    // Get user to validate existence
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // For personalized quizzes, we don't have a saved quiz in DB
    // So we'll create a virtual quiz result
    let score = 0;
    const interests = [];
    const strengths = [];
    const personalityTraits = [];
    
    // If we have a quizId and it's not 'personalized-quiz', try to get the quiz
    let quiz = null;
    if (quizId && quizId !== 'personalized-quiz') {
      quiz = await Quiz.findById(quizId);
    }
    
    // Process answers
    if (quiz && quiz.questions) {
      // Traditional quiz with saved questions
      answers.forEach((answer, index) => {
        if (index < quiz.questions.length) {
          if (answer === quiz.questions[index].correctAnswer) score++;
          
          // Categorize based on question category
          const category = quiz.questions[index].category;
          if (category === 'interest') interests.push(quiz.questions[index].options[answer]);
          else if (category === 'strength') strengths.push(quiz.questions[index].options[answer]);
          else if (category === 'personality') personalityTraits.push(quiz.questions[index].options[answer]);
        }
      });
    } else {
      // Personalized quiz - we need to analyze answers differently
      // Since we don't have the original questions, we'll use answer indices to categorize
      answers.forEach((answerIndex, questionIndex) => {
        // For personalized quizzes, we'll categorize based on question index pattern
        // Questions 0-2: interests, 3-5: strengths, 6-9: personality
        if (questionIndex >= 0 && questionIndex <= 2) {
          interests.push(`Interest_${answerIndex}`);
        } else if (questionIndex >= 3 && questionIndex <= 5) {
          strengths.push(`Strength_${answerIndex}`);
        } else if (questionIndex >= 6 && questionIndex <= 9) {
          personalityTraits.push(`Trait_${answerIndex}`);
        }
        score += (answerIndex + 1); // Simple scoring based on answer choice
      });
    }
    
    // Determine suggested streams based on results
    const suggestedStreams = [];
    if (interests.some(i => i.toLowerCase().includes('science')) || 
        strengths.some(s => s.toLowerCase().includes('analytical'))) {
      suggestedStreams.push('Science');
    }
    if (interests.some(i => i.toLowerCase().includes('arts')) || 
        personalityTraits.some(p => p.toLowerCase().includes('creative'))) {
      suggestedStreams.push('Arts');
    }
    if (interests.some(i => i.toLowerCase().includes('commerce')) || 
        strengths.some(s => s.toLowerCase().includes('business'))) {
      suggestedStreams.push('Commerce');
    }
    
    // Create quiz result object
    const quizResult = {
      quizId: quizId || 'personalized-quiz',
      score,
      interests,
      strengths,
      personalityTraits,
      suggestedStreams,
      dateTaken: new Date()
    };
    
    // Save results to user with error handling
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { $push: { quizResults: quizResult } },
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'Failed to update user with quiz results' });
      }
      
      console.log(`Quiz results saved successfully for user ${userId}`);
      
      res.json({ 
        score, 
        suggestedStreams, 
        interests, 
        strengths, 
        personalityTraits,
        message: 'Quiz results saved successfully'
      });
    } catch (saveError) {
      console.error('Error saving quiz results to database:', saveError);
      return res.status(500).json({ message: 'Failed to save quiz results to database' });
    }
    
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ message: 'Failed to submit quiz results' });
  }
};

// Generate personalized quiz questions based on user profile
exports.generatePersonalizedQuiz = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ message: 'Invalid user ID provided' });
    }
    
    // Get user profile
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate personalized questions using AI
    const questions = await aiService.generatePersonalizedQuiz(user);

    // Create a temporary quiz object (not saved to database)
    const personalizedQuiz = {
      title: `Personalized Career Assessment for ${user.firstName}`,
      description: `Custom quiz generated based on ${user.firstName}'s profile`,
      questions: questions,
      isActive: true
    };

    res.json(personalizedQuiz);
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate personalized quiz', 
      error: error.message 
    });
  }
};

// Get user's quiz results
exports.getUserQuizResults = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate user exists
    const user = await User.findById(userId).select('quizResults');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      quizResults: user.quizResults,
      totalQuizzes: user.quizResults.length
    });
  } catch (error) {
    console.error('Error fetching user quiz results:', error);
    res.status(500).json({ message: 'Failed to fetch quiz results' });
  }
};