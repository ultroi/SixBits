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

const questions = [
  {
    id: 1,
    category: 'interests',
    question: 'What type of activities do you enjoy the most?',
    options: [
      { text: 'Solving complex problems and puzzles', value: 'Science', points: 3 },
      { text: 'Creating art, music, or writing stories', value: 'Arts', points: 3 },
      { text: 'Working with numbers and data analysis', value: 'Mathematics', points: 3 },
      { text: 'Helping others and working in teams', value: 'Social Work', points: 3 }
    ]
  },
  {
    id: 2,
    category: 'interests',
    question: 'Which subject interests you the most?',
    options: [
      { text: 'Physics and Chemistry', value: 'Science', points: 3 },
      { text: 'Literature and Languages', value: 'Arts', points: 3 },
      { text: 'Mathematics and Statistics', value: 'Mathematics', points: 3 },
      { text: 'Psychology and Sociology', value: 'Social Work', points: 3 }
    ]
  },
  {
    id: 3,
    category: 'interests',
    question: 'What would you prefer to do in your free time?',
    options: [
      { text: 'Experiment with new technologies or gadgets', value: 'Science', points: 2 },
      { text: 'Read books, write, or play musical instruments', value: 'Arts', points: 2 },
      { text: 'Play strategy games or solve riddles', value: 'Mathematics', points: 2 },
      { text: 'Volunteer work or organize group activities', value: 'Social Work', points: 2 }
    ]
  },
  {
    id: 4,
    category: 'strengths',
    question: 'Which of these comes most naturally to you?',
    options: [
      { text: 'Understanding how things work and fixing them', value: 'Technical', points: 3 },
      { text: 'Expressing ideas through words or visuals', value: 'Creative', points: 3 },
      { text: 'Analyzing patterns and making calculations', value: 'Analytical', points: 3 },
      { text: 'Leading groups and resolving conflicts', value: 'Leadership', points: 3 }
    ]
  },
  {
    id: 5,
    category: 'strengths',
    question: 'How do you prefer to learn new things?',
    options: [
      { text: 'Through hands-on experiments and practical work', value: 'Technical', points: 3 },
      { text: 'Through discussions and creative projects', value: 'Creative', points: 3 },
      { text: 'Through logical reasoning and problem-solving', value: 'Analytical', points: 3 },
      { text: 'Through group discussions and teaching others', value: 'Leadership', points: 3 }
    ]
  },
  {
    id: 6,
    category: 'strengths',
    question: 'What type of challenges do you enjoy?',
    options: [
      { text: 'Building or repairing things', value: 'Technical', points: 2 },
      { text: 'Designing or creating something new', value: 'Creative', points: 2 },
      { text: 'Solving mathematical or logical puzzles', value: 'Analytical', points: 2 },
      { text: 'Organizing events or leading projects', value: 'Leadership', points: 2 }
    ]
  },
  {
    id: 7,
    category: 'personality',
    question: 'How do you typically approach new situations?',
    options: [
      { text: 'I prefer to observe and analyze first', value: 'Introverted', points: 3 },
      { text: 'I jump in and start interacting with others', value: 'Extroverted', points: 3 },
      { text: 'I look for practical solutions immediately', value: 'Practical', points: 3 },
      { text: 'I consider how it affects people around me', value: 'Empathetic', points: 3 }
    ]
  },
  {
    id: 8,
    category: 'personality',
    question: 'What motivates you the most?',
    options: [
      { text: 'Discovering new knowledge and understanding', value: 'Introverted', points: 3 },
      { text: 'Achieving recognition and social connections', value: 'Extroverted', points: 3 },
      { text: 'Completing tasks efficiently and effectively', value: 'Practical', points: 3 },
      { text: 'Making a positive impact on others\' lives', value: 'Empathetic', points: 3 }
    ]
  },
  {
    id: 9,
    category: 'personality',
    question: 'How do you make important decisions?',
    options: [
      { text: 'I carefully think through all aspects logically', value: 'Introverted', points: 2 },
      { text: 'I discuss options with others and get their input', value: 'Extroverted', points: 2 },
      { text: 'I focus on what will work best in practice', value: 'Practical', points: 2 },
      { text: 'I consider how the decision affects everyone involved', value: 'Empathetic', points: 2 }
    ]
  }
];

const AptitudeQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [questionAnimation, setQuestionAnimation] = useState('slide-in');
  const navigate = useNavigate();

  // Check for existing quiz results on component mount
  useEffect(() => {
    const existingResults = localStorage.getItem('quizResults');
    if (existingResults) {
      const parsedResults = JSON.parse(existingResults);
      setResults(parsedResults);
      setShowResults(true);
    }
  }, []);

  const calculateResults = useCallback(() => {
    const scores = { interests: {}, strengths: {}, personality: {} };

    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === parseInt(questionId));
      if (question) {
        const { category } = question;
        const { value, points } = answer;

        if (!scores[category][value]) scores[category][value] = 0;
        scores[category][value] += points;
      }
    });

    Object.keys(scores).forEach(category => {
      const categoryScores = scores[category];
      const total = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
      if (total === 0) {
        Object.keys(categoryScores).forEach(key => { categoryScores[key] = 0; });
      } else {
        Object.keys(categoryScores).forEach(key => {
          categoryScores[key] = Math.round((categoryScores[key] / total) * 100);
        });
      }
    });

    return scores;
  }, [answers]);

  const handleSubmit = useCallback(() => {
    const calculatedResults = calculateResults();
    setResults(calculatedResults);
    setShowCelebration(true);
    setTimeout(() => {
      setShowResults(true);
      setShowCelebration(false);
    }, 3000);
    localStorage.setItem('quizResults', JSON.stringify(calculatedResults));
  }, [calculateResults]);

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
    const topInterest = Object.entries(results.interests).sort(([, a], [, b]) => b - a)[0];
    const topStrength = Object.entries(results.strengths).sort(([, a], [, b]) => b - a)[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {showCelebration && <Celebration />}

        <div className="bg-white shadow-lg border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer"
                >
                  Zariya
                </button>
                <div className="text-sm text-gray-500">Quiz Results</div>
              </div>
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
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{key}</span>
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
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{key}</span>
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
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{key}</span>
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
                        <span className="font-medium text-gray-900">Top Interest: {topInterest[0]}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Based on your interests, {topInterest[0].toLowerCase()} stream would be ideal for you.
                      </p>
                    </div>
                  )}
                  {topStrength && (
                    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center mb-2">
                        <Star className="w-5 h-5 text-purple-500 mr-2 animate-bounce" />
                        <span className="font-medium text-gray-900">Top Strength: {topStrength[0]}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Your {topStrength[0].toLowerCase()} skills will help you excel in your chosen field.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/courses')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Explore Courses
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
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

  // QUIZ PAGE
  const currentQ = questions[currentQuestion];
  const progress = getProgressPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {showCelebration && <Celebration />}

      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer"
              >
                Zariya
              </button>
              <div className="text-sm text-gray-500">Aptitude Quiz</div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
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
            <div className={`mb-8 transition-all duration-300 ${questionAnimation}`}>
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
                    disabled={selectedAnswer !== null}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group ${
                      answers[currentQ.id]?.text === option.text
                        ? 'border-green-500 bg-green-50 text-green-900 shadow-lg'
                        : selectedAnswer?.text === option.text
                        ? 'border-blue-500 bg-blue-50 text-blue-900 animate-pulse'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
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
                  className="flex items-center px-6 py-3 border-2 border-transparent rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Submit Quiz
                  <CheckCircle className="w-5 h-5 ml-2" />
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
