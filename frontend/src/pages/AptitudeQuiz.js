import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Target,
  Brain,
  Heart,
  Star,
  TrendingUp,
  Check,
  Sparkles,
  Trophy,
  Zap
} from 'lucide-react';
import { quizService, authService } from '../services/api';

const AptitudeQuiz = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questionAnimation, setQuestionAnimation] = useState('');
  const navigate = useNavigate();

  // Fetch personalized questions on component mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const { user } = await authService.getCurrentUser();
        
        // Validate user exists and has ID
        if (!user || !user._id) {
          console.error('User authentication failed:', { user, userId: user?._id });
          setError('User not authenticated. Please login again.');
          navigate('/login');
          return;
        }
        
        // Generate personalized quiz
        const quizData = await quizService.generatePersonalizedQuiz(user._id);
        
        // Transform questions to match frontend format
        const transformedQuestions = quizData.questions.map((q, index) => ({
          id: index + 1,
          question: q.question,
          category: q.category,
          options: q.options.map((option, optIndex) => ({
            text: option,
            value: option,
            points: optIndex === q.correctAnswer ? 3 : (optIndex === (q.correctAnswer + 1) % 4 ? 2 : 1)
          }))
        }));
        
        setQuestions(transformedQuestions);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        setError('Failed to load personalized quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [navigate]);

  // Check for existing quiz results on component mount
  useEffect(() => {
    const checkQuizStatus = async () => {
      try {
        // Get current user
        const { user } = await authService.getCurrentUser();
        
        if (!user || !user._id) {
          // Clear any old localStorage data for unauthenticated users
          localStorage.removeItem('quizResults');
          localStorage.removeItem('quizCompleted');
          return;
        }

        // Check if user has completed quiz in database
        const userQuizResults = await quizService.getUserQuizResults(user._id);
        
        if (userQuizResults.quizResults && userQuizResults.quizResults.length > 0) {
          // User has completed quiz in database, show results
          const latestResult = userQuizResults.quizResults[userQuizResults.quizResults.length - 1];
          
          // Transform database results to frontend format
          const frontendResults = {
            interests: {},
            strengths: {},
            personality: {}
          };

          latestResult.interests?.forEach(interest => {
            frontendResults.interests[interest] = frontendResults.interests[interest] || 0;
            frontendResults.interests[interest] += 25;
          });

          latestResult.strengths?.forEach(strength => {
            frontendResults.strengths[strength] = frontendResults.strengths[strength] || 0;
            frontendResults.strengths[strength] += 25;
          });

          latestResult.personalityTraits?.forEach(trait => {
            frontendResults.personality[trait] = frontendResults.personality[trait] || 0;
            frontendResults.personality[trait] += 25;
          });

          setResults(frontendResults);
          setShowResults(true);
          
          // Update localStorage with database results
          localStorage.setItem('quizResults', JSON.stringify(frontendResults));
          localStorage.setItem('quizCompleted', 'true');
        } else {
          // User hasn't completed quiz, clear any stale localStorage data
          localStorage.removeItem('quizResults');
          localStorage.removeItem('quizCompleted');
        }
      } catch (err) {
        console.error('Failed to check quiz status:', err);
        // Clear localStorage on error to be safe
        localStorage.removeItem('quizResults');
        localStorage.removeItem('quizCompleted');
      }
    };

    checkQuizStatus();
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Get current user
      const { user } = await authService.getCurrentUser();
      
      // Transform answers to match backend format
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => {
        const questionIndex = parseInt(questionId) - 1; // Convert to 0-based index
        return questions[questionIndex].options.findIndex(opt => opt.text === answer.text);
      });

      // Submit quiz results
      const quizData = {
        quizId: 'personalized-quiz', // Since we're generating dynamic quizzes
        answers: formattedAnswers,
        userId: user._id
      };

      const result = await quizService.submitQuiz(quizData);
      
      // Show success message for permanent save
      console.log('Quiz results saved permanently to database:', result);
      
      // Transform backend result to frontend format
      const frontendResults = {
        interests: {},
        strengths: {},
        personality: {}
      };

      // Convert backend results to frontend format
      result.interests?.forEach(interest => {
        frontendResults.interests[interest] = frontendResults.interests[interest] || 0;
        frontendResults.interests[interest] += 25; // Distribute points
      });

      result.strengths?.forEach(strength => {
        frontendResults.strengths[strength] = frontendResults.strengths[strength] || 0;
        frontendResults.strengths[strength] += 25;
      });

      result.personalityTraits?.forEach(trait => {
        frontendResults.personality[trait] = frontendResults.personality[trait] || 0;
        frontendResults.personality[trait] += 25;
      });

      setResults(frontendResults);
      setShowCelebration(true);
      
      // Add success notification
      setTimeout(() => {
        alert('✅ Quiz results saved successfully to your profile!');
        setShowResults(true);
        setShowCelebration(false);
      }, 3000);
      
      localStorage.setItem('quizResults', JSON.stringify(frontendResults));
      localStorage.setItem('quizCompleted', 'true');
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, questions]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleSubmit]);

  const handleAnswer = (questionId, answer) => {
    setSelectedAnswer(answer);
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    // Add a small delay before allowing next question
    setTimeout(() => {
      setSelectedAnswer(null);
    }, 800);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setQuestionAnimation('slide-out');
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setQuestionAnimation('slide-in');
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setQuestionAnimation('slide-out-reverse');
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setQuestionAnimation('slide-in-reverse');
      }, 300);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => ((currentQuestion + 1) / questions.length) * 100;

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'interests': return <Heart className="w-5 h-5" />;
      case 'strengths': return <Target className="w-5 h-5" />;
      case 'personality': return <Brain className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'interests': return 'from-pink-500 to-rose-500';
      case 'strengths': return 'from-blue-500 to-indigo-500';
      case 'personality': return 'from-green-500 to-teal-500';
      default: return 'from-purple-500 to-violet-500';
    }
  };

  // Celebration Component
  const Celebration = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-bounce">
          <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-2 animate-pulse">Congratulations!</h2>
        <p className="text-xl text-white animate-pulse">Quiz Completed Successfully</p>
        <div className="mt-6">
          <Sparkles className="w-8 h-8 text-yellow-300 animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );

  // RESULTS PAGE
  if (showResults && results) {
    // Map placeholder keys to meaningful names
    const interestLabels = {
      Interest_0: 'Technology',
      // Updated Interest_1 from 'Art' to 'Arts & Design' per requested correction
      Interest_1: 'Arts & Design',
      Interest_2: 'Science',
      Interest_3: 'Business'
    };
    const strengthLabels = {
      Strength_0: 'Communication',
      Strength_1: 'Problem Solving',
      Strength_2: 'Creativity',
      Strength_3: 'Leadership'
    };
    const personalityLabels = {
      Trait_0: 'Introvert',
      // Updated Trait_1 label to a clearer word 'Outgoing'
      Trait_1: 'Outgoing',
      Trait_2: 'Analytical',
      Trait_3: 'Empathetic'
    };

    // Keyword mappings for better context in recommendations
    const interestKeywords = {
      Interest_0: ['programming', 'software', 'computers'],
      Interest_1: ['design', 'visual', 'creative'],
      Interest_2: ['research', 'laboratory', 'experimentation'],
      Interest_3: ['entrepreneurship', 'management', 'commerce']
    };

    const personalityKeywords = {
      Trait_0: ['reflective', 'reserved', 'thoughtful'],
      Trait_1: ['social', 'energetic', 'communicative'],
      Trait_2: ['logical', 'data-driven', 'detail-oriented'],
      Trait_3: ['empathetic', 'people-oriented', 'supportive']
    };

    // Helper to get label or fallback to key
    const getLabel = (key, labels) => labels[key] || key;

  const topInterest = Object.entries(results.interests).sort(([, a], [, b]) => b - a)[0];
  const topStrength = Object.entries(results.strengths).sort(([, a], [, b]) => b - a)[0];
  const topPersonality = Object.entries(results.personality).sort(([, a], [, b]) => b - a)[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {showCelebration && <Celebration />}

        <div className="bg-white shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="text-sm text-gray-500">Quiz Results</div>
            </div>
          </div>
        </div>

        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-[1.02] transition-transform duration-300">
              <div className="text-center mb-8">
                <div className="animate-bounce">
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Quiz Complete!
                </h1>
                <p className="text-gray-600 text-lg">Here are your aptitude assessment results</p>
              </div>

              {/* Results Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Interests */}
                <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-pink-100 rounded-lg mr-3 animate-pulse">
                      <Heart className="w-6 h-6 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Interests</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(results.interests).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center group">
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{getLabel(key, interestLabels)}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-pink-500 to-red-500 h-3 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3 animate-pulse">
                      <Target className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(results.strengths).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center group">
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{getLabel(key, strengthLabels)}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personality */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-green-100 rounded-lg mr-3 animate-pulse">
                      <Brain className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Personality</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(results.personality).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center group">
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{getLabel(key, personalityLabels)}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 hover:shadow-lg transition-all duration-300">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="w-6 h-6 text-indigo-500 mr-2 animate-pulse" />
                  Recommended Streams
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topInterest && (
                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500 mr-2 animate-bounce" />
                        <span className="font-medium text-gray-900">Top Interest: {getLabel(topInterest[0], interestLabels)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Based on your interests, {getLabel(topInterest[0], interestLabels).toLowerCase()} stream would be ideal for you.
                      </p>
                      {/* Show keywords for the interest if available */}
                      {interestKeywords[topInterest[0]] && (
                        <div className="text-xs text-gray-500">Keywords: {interestKeywords[topInterest[0]].join(', ')}</div>
                      )}
                    </div>
                  )}
                  {topStrength && (
                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center mb-2">
                        <Star className="w-5 h-5 text-purple-500 mr-2 animate-bounce" />
                        <span className="font-medium text-gray-900">Top Strength: {getLabel(topStrength[0], strengthLabels)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Your {getLabel(topStrength[0], strengthLabels).toLowerCase()} skills will help you excel in your chosen field.
                      </p>
                      {/* If we also have a top personality, show a related keyword hint */}
                      {topPersonality && personalityKeywords[topPersonality[0]] && (
                        <div className="text-xs text-gray-500">Personality keywords: {personalityKeywords[topPersonality[0]].join(', ')}</div>
                      )}
                    </div>
                  )}
                  {/* Additionally, show a small card for top personality if present */}
                  {topPersonality && (
                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center mb-2">
                        <Brain className="w-5 h-5 text-green-500 mr-2 animate-bounce" />
                        <span className="font-medium text-gray-900">Top Personality: {getLabel(topPersonality[0], personalityLabels)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Your personality leans towards {getLabel(topPersonality[0], personalityLabels).toLowerCase()} traits.
                      </p>
                      {personalityKeywords[topPersonality[0]] && (
                        <div className="text-xs text-gray-500">Keywords: {personalityKeywords[topPersonality[0]].join(', ')}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/courses')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Explore Courses
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Your Personalized Quiz</h2>
          <p className="text-gray-600">Creating questions based on your profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Quiz</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No questions loaded
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-600">Unable to generate personalized questions at this time.</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = getProgressPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {showCelebration && <Celebration />}

      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <div className="text-sm text-gray-500">Aptitude Assessment</div>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6 transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl animate-pulse">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Aptitude Assessment</h1>
                  <p className="text-gray-600">Discover your interests and strengths</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <Clock className="w-5 h-5 text-red-500 animate-pulse" />
                  <span className="font-medium">{formatTime(timeLeft)}</span>
                </div>
                <div className="text-right bg-gray-50 px-3 py-2 rounded-lg">
                  <div className="text-sm text-gray-600">Question</div>
                  <div className="text-lg font-bold text-gray-900">
                    {currentQuestion + 1}/{questions.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-8 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getCategoryColor(currentQ.category)}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Question */}
            <div className={`mb-8 ${questionAnimation}`}>
              <div className="flex items-center mb-4">
                <div className={`p-3 bg-gradient-to-r ${getCategoryColor(currentQ.category)} rounded-xl mr-3 animate-pulse`}>
                  {getCategoryIcon(currentQ.category)}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{currentQ.question}</h2>
              </div>

              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(currentQ.id, option)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      (answers[currentQ.id]?.text === option.text || selectedAnswer?.text === option.text)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex-1">{option.text}</span>
                      {answers[currentQ.id]?.text === option.text && (
                        <Check className="w-5 h-5 text-green-500 animate-bounce" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex items-center px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </button>
              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center px-4 py-2 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                  <CheckCircle className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!answers[currentQ.id]}
                  className="flex items-center px-6 py-3 border-2 border-transparent rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AptitudeQuiz;
