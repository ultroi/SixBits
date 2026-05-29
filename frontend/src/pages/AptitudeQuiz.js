import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Zap,
  Users
} from 'lucide-react';
import { quizService, authService, courseService } from '../services/api';

const AptitudeQuiz = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [courseSuggestions, setCourseSuggestions] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questionAnimation, setQuestionAnimation] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate();

  const parseApiError = (error) => {
    if (!error) return 'An error occurred. Please try again.';
    return error.response?.data?.message || error.message || 'An error occurred. Please try again.';
  };

  const toggleActive = (cat) => setActiveCategory(prev => prev === cat ? null : cat);

  // Prevent duplicate initialization (StrictMode double-mount) and unnecessary API calls
  const initRanRef = useRef(false);
  const generationInProgressRef = useRef(false);

  useEffect(() => {
    if (initRanRef.current) return; // already initialized
    initRanRef.current = true;

    const init = async () => {
      setLoading(true);
      setError(null);

      try {
        const { user } = await authService.getCurrentUser();
        if (!user || !user._id) {
          console.error('User authentication failed:', { user });
          setError('User not authenticated. Please login again.');
          navigate('/login');
          setLoading(false);
          return;
        }

        const userId = user._id;

        // 1) If quiz completed flag exists locally, verify with server before using local results.
        //    This prevents stale local results from blocking a retake when DB entries were removed.
        const localCompleted = localStorage.getItem('quizCompleted');
        const localResults = localStorage.getItem('quizResults');
        if (localCompleted === 'true' && localResults) {
          try {
            const parsed = JSON.parse(localResults);

            // Check server to confirm the user still has saved quiz results.
            try {
              const serverResults = await quizService.getUserQuizResults(userId);
              const serverHasResults = serverResults && Array.isArray(serverResults.quizResults) && serverResults.quizResults.length > 0;

              if (serverHasResults) {
                // Server has results -> safe to show cached frontend results
                setResults(parsed);
                setShowResults(true);

                const cachedSuggestions = localStorage.getItem('courseSuggestions');
                if (cachedSuggestions) {
                  try { setCourseSuggestions(JSON.parse(cachedSuggestions)); } catch (e) { localStorage.removeItem('courseSuggestions'); }
                }

                setLoading(false);
                return; // skip generation
              } else {
                // Server has no results: clear stale local cache and continue to generation
                console.info('Local quiz result present but server has no results - clearing local cache to allow retake');
                localStorage.removeItem('quizResults');
                localStorage.removeItem('quizCompleted');
                localStorage.removeItem('courseSuggestions');
                // continue to generation flow
              }
            } catch (serverErr) {
              // If server check fails (network issue), fall back to local cached results to avoid blocking user.
              console.warn('Could not verify local quiz results with server, using local cache as fallback:', serverErr);
              setResults(parsed);
              setShowResults(true);

              const cachedSuggestions = localStorage.getItem('courseSuggestions');
              if (cachedSuggestions) {
                try { setCourseSuggestions(JSON.parse(cachedSuggestions)); } catch (e) { localStorage.removeItem('courseSuggestions'); }
              }

              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('Failed to parse local quiz results, will continue:', err);
            localStorage.removeItem('quizResults');
            localStorage.removeItem('quizCompleted');
          }
        }

        // 2) If there's a recently cached generated quiz (24h), use it to avoid regen
        const cacheKey = `personalizedQuiz_${userId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const age = Date.now() - (parsed.timestamp || 0);
            const ONE_DAY = 24 * 60 * 60 * 1000;
            if (parsed.data && age < ONE_DAY) {
              const transformed = parsed.data.questions.map((q, index) => ({
                id: index + 1,
                question: q.question,
                category: q.category,
                options: q.options.map((option, optIndex) => ({ text: option, value: option, points: optIndex === q.correctAnswer ? 3 : (optIndex === (q.correctAnswer + 1) % 4 ? 2 : 1) }))
              }));
              setQuestions(transformed);
              setLoading(false);
              return;
            } else {
              localStorage.removeItem(cacheKey);
            }
          } catch (err) {
            console.error('Failed to parse cached generated quiz, will regenerate:', err);
            localStorage.removeItem(cacheKey);
          }
        }

        // 3) Check server: if user already completed quiz, use server results
        try {
          const userQuizResults = await quizService.getUserQuizResults(userId);
          if (userQuizResults.quizResults && userQuizResults.quizResults.length > 0) {
            const latest = userQuizResults.quizResults[userQuizResults.quizResults.length - 1];
            const frontendResults = { interests: {}, strengths: {}, personality: {} };
            latest.interests?.forEach(i => { frontendResults.interests[i] = (frontendResults.interests[i] || 0) + 25; });
            latest.strengths?.forEach(s => { frontendResults.strengths[s] = (frontendResults.strengths[s] || 0) + 25; });
            latest.personalityTraits?.forEach(p => { frontendResults.personality[p] = (frontendResults.personality[p] || 0) + 25; });

            setResults(frontendResults);
            setShowResults(true);

            try { localStorage.setItem('quizResults', JSON.stringify(frontendResults)); localStorage.setItem('quizCompleted', 'true'); } catch (e) { /* ignore */ }

            // try to reuse cached suggestions
            const storedSuggestions = localStorage.getItem('courseSuggestions');
            if (storedSuggestions) {
              try { setCourseSuggestions(JSON.parse(storedSuggestions)); } catch (e) { localStorage.removeItem('courseSuggestions'); }
            } else {
              try {
                const suggestions = await courseService.getCourseSuggestions(frontendResults);
                setCourseSuggestions(suggestions);
                localStorage.setItem('courseSuggestions', JSON.stringify(suggestions));
              } catch (e) { console.error('Failed to fetch course suggestions for server results:', e); }
            }

            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Failed to fetch user quiz results from server:', err);
          // continue to generation path
        }

        // 4) Finally, generate personalized quiz only if not already in progress
        if (generationInProgressRef.current) {
          setLoading(false);
          return; // another tab/instance is generating
        }

        try {
          generationInProgressRef.current = true;
          const quizData = await quizService.generatePersonalizedQuiz(userId);
          if (!quizData || !quizData.questions) throw new Error('Invalid quiz data');

          const transformedQuestions = quizData.questions.map((q, index) => ({
            id: index + 1,
            question: q.question,
            category: q.category,
            options: q.options.map((option, optIndex) => ({ text: option, value: option, points: optIndex === q.correctAnswer ? 3 : (optIndex === (q.correctAnswer + 1) % 4 ? 2 : 1) }))
          }));

          setQuestions(transformedQuestions);

          try {
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: quizData }));
          } catch (e) { console.error('Failed to cache generated quiz:', e); }
        } catch (err) {
          console.error('Failed to generate personalized quiz:', err);
          setError(parseApiError(err));
        } finally {
          generationInProgressRef.current = false;
          setLoading(false);
        }
      } catch (err) {
        console.error('Quiz init error:', err);
        setError('Failed to initialize quiz. Please try again.');
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

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
      
      // Fetch course suggestions
      try {
        const suggestions = await courseService.getCourseSuggestions(frontendResults);
        setCourseSuggestions(suggestions);
        try {
          localStorage.setItem('courseSuggestions', JSON.stringify(suggestions));
        } catch (err) {
          console.error('Failed to cache course suggestions:', err);
        }
      } catch (error) {
        console.error('Failed to get course suggestions:', error);
        // Don't block the UI if suggestions fail
      }
      
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
    if (!quizStarted) return undefined;

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
  }, [handleSubmit, quizStarted]);

  // Allow user to retake the quiz: clear cache/local results and regenerate a new personalized quiz
  const handleRetake = useCallback(async () => {
    try {
      setLoading(true);
      setShowResults(false);
      setResults(null);
      setCourseSuggestions(null);
      setQuestions([]);
      setCurrentQuestion(0);
      setAnswers({});
      setQuizStarted(false);
      setTimeLeft(0);

      const { user } = await authService.getCurrentUser();
      if (!user || !user._id) {
        setError('User not authenticated. Please login again.');
        setLoading(false);
        return;
      }

      const userId = user._id;
      const cacheKey = `personalizedQuiz_${userId}`;

      // Clear any local cache that could block regeneration
      try {
        localStorage.removeItem('quizResults');
        localStorage.removeItem('quizCompleted');
        localStorage.removeItem('courseSuggestions');
        localStorage.removeItem(cacheKey);
      } catch (e) {
        console.warn('Failed to clear local storage during retake:', e);
      }

      if (generationInProgressRef.current) {
        // If another tab is generating, wait a short while and try to fetch cached quiz
        console.info('Generation already in progress in another tab/instance. Waiting briefly...');
        setTimeout(async () => {
          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              const transformed = parsed.data.questions.map((q, index) => ({
                id: index + 1,
                question: q.question,
                category: q.category,
                options: q.options.map((option, optIndex) => ({ text: option, value: option, points: optIndex === q.correctAnswer ? 3 : (optIndex === (q.correctAnswer + 1) % 4 ? 2 : 1) }))
              }));
              setQuestions(transformed);
              setLoading(false);
              return;
            }
          } catch (err) { /* ignore */ }
          setLoading(false);
        }, 1200);
        return;
      }

      try {
        generationInProgressRef.current = true;
        const quizData = await quizService.generatePersonalizedQuiz(userId);
        if (!quizData || !quizData.questions) throw new Error('Invalid quiz data');

        const transformedQuestions = quizData.questions.map((q, index) => ({
          id: index + 1,
          question: q.question,
          category: q.category,
          options: q.options.map((option, optIndex) => ({ text: option, value: option, points: optIndex === q.correctAnswer ? 3 : (optIndex === (q.correctAnswer + 1) % 4 ? 2 : 1) }))
        }));

        setQuestions(transformedQuestions);
        try { localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: quizData })); } catch (e) { /* ignore */ }
      } catch (err) {
        console.error('Failed to regenerate quiz for retake:', err);
        setError(parseApiError(err));
      } finally {
        generationInProgressRef.current = false;
        setLoading(false);
      }
    } catch (err) {
      console.error('Retake error:', err);
      setError(parseApiError(err));
      setLoading(false);
    }
  }, []);

  const handleStartQuiz = () => {
    const totalSeconds = Math.min(3600, Math.max(questions.length * 90, 600));
    setTimeLeft(totalSeconds);
    setQuizStarted(true);
  };

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

  const formatCategoryName = (category) => {
    switch (category) {
      case 'logical': return 'Logical / Analytical';
      case 'numerical': return 'Numerical / Reasoning';
      case 'career_preference': return 'Career Preference';
      case 'decision_making': return 'Decision-making';
      case 'work_style': return 'Work-style Alignment';
      case 'interests': return 'Interests';
      case 'strengths': return 'Strengths';
      case 'personality': return 'Personality';
      default: return category ? category.replace(/_/g, ' ') : 'General';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'logical': return <Brain className="w-5 h-5" />;
      case 'numerical': return <TrendingUp className="w-5 h-5" />;
      case 'career_preference': return <BookOpen className="w-5 h-5" />;
      case 'decision_making': return <ArrowRight className="w-5 h-5" />;
      case 'work_style': return <Users className="w-5 h-5" />;
      case 'interests': return <Heart className="w-5 h-5" />;
      case 'strengths': return <Target className="w-5 h-5" />;
      case 'personality': return <Brain className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'logical': return 'from-blue-500 to-indigo-500';
      case 'numerical': return 'from-yellow-400 to-orange-500';
      case 'career_preference': return 'from-teal-500 to-cyan-500';
      case 'decision_making': return 'from-purple-500 to-violet-500';
      case 'work_style': return 'from-green-500 to-emerald-500';
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

  // Helper utilities used by the interactive result UI
  const getMaxPercent = (obj) => {
    const vals = Object.values(obj || {});
    if (!vals || vals.length === 0) return 0;
    return Math.max(...vals);
  };

  const getCategoryMap = (category, resultsObj) => {
    switch (category) {
      case 'interests': return resultsObj.interests || {};
      case 'strengths': return resultsObj.strengths || {};
      case 'personality': return resultsObj.personality || {};
      default: return {};
    }
  };

  const getLabelsForCategory = (category) => {
    switch (category) {
      case 'interests': return interestLabels;
      case 'strengths': return strengthLabels;
      case 'personality': return personalityLabels;
      default: return {};
    }
  };

  const getKeywordsForCategory = (category) => {
    switch (category) {
      case 'interests': return interestKeywords;
      case 'personality': return personalityKeywords;
      default: return {};
    }
  };

  const getGradientForCategory = (category) => {
    switch (category) {
      case 'interests': return 'from-pink-500 to-red-500';
      case 'strengths': return 'from-blue-500 to-indigo-500';
      case 'personality': return 'from-green-500 to-teal-500';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  // Simple animated circular ring component using SVG
  const AnimatedRing = ({ label, value = 0, onClick, active, colorFrom, colorTo, icon }) => {
    const size = 120;
    const stroke = 10;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

    return (
      <div onClick={onClick} className={`bg-white rounded-xl p-4 shadow-md cursor-pointer transform transition-all duration-300 ${active ? 'scale-105 shadow-lg' : 'hover:scale-102'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">{icon}</div>
            <div className="text-sm font-medium text-gray-800">{label}</div>
          </div>
          <div className="text-sm text-gray-500">Top</div>
        </div>
        <div className="flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <linearGradient id={`g-${label}`} x1="0%" x2="100%">
                <stop offset="0%" stopColor={`var(--tw-gradient-from, currentColor)`} />
              </linearGradient>
            </defs>
            <circle cx={size/2} cy={size/2} r={radius} stroke="#eee" strokeWidth={stroke} fill="none" />
            <circle
              cx={size/2}
              cy={size/2}
              r={radius}
              strokeWidth={stroke}
              strokeLinecap="round"
              stroke={`url(#g-${label})`}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size/2} ${size/2})`}
              fill="none"
              className="transition-all duration-1000 ease-out"
            />
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-sm font-semibold" fill="#111">{value}%</text>
          </svg>
        </div>
      </div>
    );
  };

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
            <div className="bg-white rounded-3xl shadow-2xl p-8 transform hover:scale-[1.01] transition-transform duration-300 border-2 border-indigo-100 mb-8">
              <div className="text-center mb-10">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 rounded-full blur-lg opacity-60 animate-pulse"></div>
                    <div className="relative animate-bounce">
                      <CheckCircle className="w-24 h-24 text-green-500" />
                    </div>
                  </div>
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
                  🎉 Quiz Complete!
                </h1>
                <p className="text-xl text-gray-600">Your aptitude assessment results are ready</p>
                <p className="text-sm text-gray-500 mt-2">📊 Scroll down to see your detailed analysis</p>
              </div>

              {/* Interactive Results Summary: animated rings + detail panel */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500" />
                    Your Performance Overview
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button onClick={handleRetake} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                      🔄 Retake Quiz
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* AnimatedRing component instances */}
                  {/** AnimatedRing component defined inline below **/}
                  <AnimatedRing
                    label="Interests"
                    value={getMaxPercent(results.interests)}
                    details={results.interests}
                    onClick={() => toggleActive('interests')}
                    colorFrom="pink-500"
                    colorTo="red-500"
                    active={activeCategory === 'interests'}
                    icon={<Heart className="w-5 h-5 text-pink-500" />}
                  />

                  <AnimatedRing
                    label="Strengths"
                    value={getMaxPercent(results.strengths)}
                    details={results.strengths}
                    onClick={() => toggleActive('strengths')}
                    colorFrom="blue-500"
                    colorTo="indigo-500"
                    active={activeCategory === 'strengths'}
                    icon={<Target className="w-5 h-5 text-blue-500" />}
                  />

                  <AnimatedRing
                    label="Personality"
                    value={getMaxPercent(results.personality)}
                    details={results.personality}
                    onClick={() => toggleActive('personality')}
                    colorFrom="green-500"
                    colorTo="teal-500"
                    active={activeCategory === 'personality'}
                    icon={<Brain className="w-5 h-5 text-green-500" />}
                  />
                </div>
              </div>

              {/* Detail drawer */}
              <div className="mb-8">
                {activeCategory ? (
                  <div className="bg-white rounded-xl p-6 shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 capitalize">{activeCategory} — detailed breakdown</h4>
                        <p className="text-sm text-gray-600 mt-1"></p>
                      </div>
                      <div className="text-sm text-gray-500"></div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {Object.entries(getCategoryMap(activeCategory, results)).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-sm font-medium text-gray-800">{getLabel(key, getLabelsForCategory(activeCategory))}</div>
                              <div className="text-sm text-gray-600">{val}%</div>
                            </div>
                            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                              <div
                                className={`h-3 rounded-full bg-gradient-to-r ${getGradientForCategory(activeCategory)}`}
                                style={{ width: `${val}%`, transition: 'width 900ms ease-out' }}
                                onClick={() => {
                                  const keywords = getKeywordsForCategory(activeCategory)[key] || [];
                                  const text = `${getLabel(key, getLabelsForCategory(activeCategory))}: ${val}%. Keywords: ${keywords.join(', ')}`;
                                  try { navigator.clipboard.writeText(text); alert('Keywords copied'); } catch (e) { alert('Copy failed'); }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <h4 className="text-lg font-semibold text-gray-900">Overview & Recommendations</h4>
                    <p className="text-sm text-gray-600 mt-2">Tap any of the circular cards above to inspect category-level details and copy keywords for quick sharing.</p>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {topInterest && (
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <div className="text-sm font-medium">Top Interest</div>
                          <div className="font-semibold text-gray-900">{getLabel(topInterest[0], interestLabels)} — {topInterest[1]}%</div>
                        </div>
                      )}
                      {topStrength && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm font-medium">Top Strength</div>
                          <div className="font-semibold text-gray-900">{getLabel(topStrength[0], strengthLabels)} — {topStrength[1]}%</div>
                        </div>
                      )}
                      {topPersonality && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="text-sm font-medium">Top Personality</div>
                          <div className="font-semibold text-gray-900">{getLabel(topPersonality[0], personalityLabels)} — {topPersonality[1]}%</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

              {/* Course Suggestions */}
              {courseSuggestions && (
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 mb-6 border-2 border-indigo-200 hover:shadow-2xl transition-all duration-300">
                  <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <BookOpen className="w-8 h-8 text-indigo-600 animate-pulse" />
                    🎓 AI-Powered Course Recommendations
                  </h3>
                  
                  {/* Top 3 Courses */}
                  <div className="mb-8">
                    <h4 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-2 pb-3 border-b-2 border-yellow-300">
                      <Trophy className="w-7 h-7 text-yellow-500 animate-bounce" />
                      Top 3 Perfect-Match Courses
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {courseSuggestions.topCourses?.map((course, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-t-4 border-yellow-400 relative overflow-hidden group">
                          {/* Rank Badge */}
                          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-3xl opacity-80 group-hover:opacity-100 transition-opacity">
                            #{index + 1}
                          </div>
                          
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-xl flex items-center justify-center mr-3 shadow-md">
                              <span className="text-white font-bold text-xl">{index + 1}</span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-lg">{course.name}</h5>
                          </div>
                          <p className="text-sm text-gray-700 bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg">
                            <strong className="text-indigo-700">Career Prospects:</strong> {course.careerProspects}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Alternative Courses */}
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-2 pb-3 border-b-2 border-purple-300">
                      <Sparkles className="w-7 h-7 text-purple-500 animate-bounce" />
                      Alternative Courses Worth Exploring
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {courseSuggestions.alternativeCourses?.map((course, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-t-4 border-purple-400 group">
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-300 to-pink-300 rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg">
                              <span className="text-white font-bold text-lg">A{index + 1}</span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-lg">{course.name}</h5>
                          </div>
                          <p className="text-sm text-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg">
                            <strong className="text-purple-700">Career Prospects:</strong> {course.careerProspects}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
    const needsProfileUpdate = error.toLowerCase().includes('complete your profile');

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Quiz</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {needsProfileUpdate && (
              <button
                onClick={() => navigate('/settings')}
                className="px-6 py-3 bg-white text-indigo-700 border border-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Complete Profile
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
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

  if (!quizStarted) {
    const topicCounts = questions.reduce((counts, question) => {
      const category = question.category || 'general';
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});

    const topics = Object.entries(topicCounts).map(([category, count]) => ({
      category,
      label: formatCategoryName(category),
      count,
    }));

    const estimatedMinutes = Math.max(10, Math.ceil(questions.length * 90 / 60));

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-2xl mx-auto flex min-h-[calc(100vh-4rem)] items-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="w-full rounded-3xl bg-white shadow-2xl p-8 overflow-hidden border-2 border-indigo-100 hover:border-indigo-300 transition-all duration-300">
            <div className="grid gap-6">
              {/* Header */}
              <div className="text-center mb-2">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shadow-lg">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Aptitude Assessment</h1>
                <p className="mt-3 text-lg text-gray-600">
                  🎯 A personalized quiz to discover your strengths, interests & ideal career path
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 text-center transform hover:scale-105 transition-transform duration-300 hover:shadow-lg">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">📝 Total Questions</div>
                  <div className="mt-4 text-4xl font-bold text-indigo-900">{questions.length}</div>
                  <p className="text-sm text-indigo-600 mt-2">Multiple choice questions</p>
                </div>
                <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 text-center transform hover:scale-105 transition-transform duration-300 hover:shadow-lg">
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-700">⏱️ Estimated Time</div>
                  <div className="mt-4 text-4xl font-bold text-purple-900">{estimatedMinutes} <span className="text-2xl">min</span></div>
                  <p className="text-sm text-purple-600 mt-2">No time pressure</p>
                </div>
              </div>

              {/* Topics Covered */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  Topics Covered
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {topics.slice(0, 4).map((topic) => (
                    <div key={topic.category} className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 transform hover:scale-105 transition-all duration-300 hover:shadow-md hover:border-indigo-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-gray-600">{topic.label}</div>
                          <div className="mt-2 text-2xl font-bold text-gray-900">{topic.count}</div>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                          {getCategoryIcon(topic.category)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What to Expect */}
              <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  What to Expect
                </h3>
                <div className="grid gap-3 text-gray-700">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-semibold text-green-900">4-Option Multiple Choice</p>
                      <p className="text-sm text-green-700">Easy to understand format</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <p className="font-semibold text-green-900">Personalized Questions</p>
                      <p className="text-sm text-green-700">Based on your profile & qualifications</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="font-semibold text-green-900">Instant Results & Suggestions</p>
                      <p className="text-sm text-green-700">Get career recommendations right away</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartQuiz}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 py-4 text-lg font-bold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap className="w-6 h-6" />
                Start Assessment Now
              </button>
              
              <p className="text-center text-sm text-gray-500">✓ You can pause and resume later</p>
            </div>
          </div>
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quiz Header */}
          <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6 border-2 border-indigo-100 sticky top-4 z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Aptitude Assessment</h1>
                  <p className="text-sm text-gray-600">Question {currentQuestion + 1} of {questions.length}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 px-4 py-3 rounded-xl">
                  <Clock className="w-5 h-5 text-red-500 animate-pulse mb-1" />
                  <span className="font-bold text-lg text-red-700">{formatTime(timeLeft)}</span>
                  <span className="text-xs text-red-600 font-medium">remaining</span>
                </div>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Progress</span>
                <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className={`h-4 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getCategoryColor(currentQ.category)} shadow-lg`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 border-2 border-indigo-100 transform hover:scale-[1.01] transition-all duration-300">
            {/* Category Badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`p-3 bg-gradient-to-r ${getCategoryColor(currentQ.category)} rounded-xl shadow-md`}>
                {getCategoryIcon(currentQ.category)}
              </div>
              <div>
                <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getCategoryColor(currentQ.category)}`}>
                  {formatCategoryName(currentQ.category)}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <h2 className={`text-3xl font-bold text-gray-900 mb-8 leading-tight ${questionAnimation}`}>
              {currentQ.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, index) => {
                const isSelected = answers[currentQ.id]?.text === option.text;
                const isHighlighted = selectedAnswer?.text === option.text;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(currentQ.id, option)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-102 ${
                      isSelected || isHighlighted
                        ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg shadow-green-200'
                        : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                          isSelected || isHighlighted
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className={`text-lg font-medium ${isSelected || isHighlighted ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                          {option.text}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="animate-bounce">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all duration-300 transform ${
                currentQuestion === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-50'
                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-lg hover:scale-105 active:scale-95'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>

            {/* Question Indicators */}
            <div className="hidden sm:flex items-center gap-2">
              {questions.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    idx === currentQuestion
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 w-8'
                      : idx < currentQuestion
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
              {questions.length > 5 && <span className="text-gray-500 text-sm ml-2">...</span>}
            </div>

            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Quiz
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!answers[currentQ.id]}
                className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-white transition-all duration-300 transform ${
                  !answers[currentQ.id]
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                }`}
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AptitudeQuiz;
