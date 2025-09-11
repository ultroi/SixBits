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
  TrendingUp
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
  const navigate = useNavigate();

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
    setShowResults(true);
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
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => { if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1); };
  const handlePrevious = () => { if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1); };

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

  // RESULTS PAGE
  if (showResults && results) {
    const topInterest = Object.entries(results.interests).sort(([, a], [, b]) => b - a)[0];
    const topStrength = Object.entries(results.strengths).sort(([, a], [, b]) => b - a)[0];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
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
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
                <p className="text-gray-600">Here are your aptitude assessment results</p>
              </div>

              {/* Results Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Interests */}
                <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <Heart className="w-6 h-6 text-pink-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Interests</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(results.interests).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{key}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${value}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <Target className="w-6 h-6 text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(results.strengths).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{key}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${value}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personality */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <Brain className="w-6 h-6 text-green-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Personality</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(results.personality).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{key}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${value}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recommended Streams</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topInterest && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500 mr-2" />
                        <span className="font-medium text-gray-900">Top Interest: {topInterest[0]}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Based on your interests, {topInterest[0].toLowerCase()} stream would be ideal for you.
                      </p>
                    </div>
                  )}
                  {topStrength && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center mb-2">
                        <Star className="w-5 h-5 text-purple-500 mr-2" />
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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

  // QUIZ PAGE
  const currentQ = questions[currentQuestion];
  const progress = getProgressPercentage();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
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
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-8 h-8 text-indigo-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Aptitude Assessment</h1>
                  <p className="text-gray-600">Discover your interests and strengths</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">{formatTime(timeLeft)}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Question</div>
                  <div className="text-lg font-bold text-gray-900">
                    {currentQuestion + 1}/{questions.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Question */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                  {getCategoryIcon(currentQ.category)}
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{currentQ.question}</h2>
              </div>

              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(currentQ.id, option)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      answers[currentQ.id]?.text === option.text
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                    }`}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>
              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="flex items-center px-4 py-2 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Submit Quiz
                  <CheckCircle className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-4 py-2 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
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