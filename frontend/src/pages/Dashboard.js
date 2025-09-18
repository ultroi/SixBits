import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  MapPin,
  Calendar,
  MessageSquare,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Settings,
  Bell,
  X,
  Sparkles,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quizService, authService } from '../services/api';

const Dashboard = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { logout, user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        
  // Get current user data
  const { user: currentUser } = await authService.getCurrentUser();

  // Update auth context so components relying on context immediately see the latest user
  if (currentUser && updateUser) updateUser(currentUser);
        
        // Check quiz completion status
        if (currentUser && currentUser._id) {
          const quizResults = await quizService.getUserQuizResults(currentUser._id);
          const hasCompletedQuiz = quizResults.quizResults && quizResults.quizResults.length > 0;
          setQuizCompleted(hasCompletedQuiz);
          
          // Generate personalized recommendations based on quiz results
          if (hasCompletedQuiz) {
            const latestResult = quizResults.quizResults[quizResults.quizResults.length - 1];
            generateRecommendations(latestResult, currentUser);
          } else {
            // Default recommendations for new users
            setRecommendations([
              {
                type: 'action',
                title: 'Complete Aptitude Quiz',
                description: 'Take our personalized quiz to get career recommendations',
                score: 100,
                action: 'Take Quiz'
              }
            ]);
          }
        }
        
        // Mock upcoming events (can be replaced with real data later)
        setUpcomingEvents([
          {
            title: 'JEE Main Registration',
            date: '2025-01-15',
            type: 'exam',
            priority: 'high'
          },
          {
            title: 'Scholarship Application',
            date: '2025-01-20',
            type: 'scholarship',
            priority: 'medium'
          }
        ]);
        
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Set default state on error
        setQuizCompleted(false);
        setRecommendations([
          {
            type: 'action',
            title: 'Complete Aptitude Quiz',
            description: 'Take our personalized quiz to get career recommendations',
            score: 100,
            action: 'Take Quiz'
          }
        ]);
      }
    };

    fetchUserData();
  }, [updateUser]);

  const generateRecommendations = (quizResult, user) => {
    const recs = [];
    
    // Based on interests
    if (quizResult.interests && quizResult.interests.length > 0) {
      if (quizResult.interests.some(i => i.toLowerCase().includes('science'))) {
        recs.push({
          type: 'course',
          title: 'B.Tech Computer Science',
          description: 'Based on your Science interest',
          score: 95
        });
      }
      if (quizResult.interests.some(i => i.toLowerCase().includes('commerce'))) {
        recs.push({
          type: 'course',
          title: 'B.Com (Hons)',
          description: 'Based on your Commerce interest',
          score: 90
        });
      }
    }
    
    // Based on suggested streams
    if (quizResult.suggestedStreams && quizResult.suggestedStreams.length > 0) {
      quizResult.suggestedStreams.forEach(stream => {
        if (stream === 'Science') {
          recs.push({
            type: 'stream',
            title: 'Science Stream',
            description: 'Recommended based on your quiz results',
            score: 92
          });
        } else if (stream === 'Commerce') {
          recs.push({
            type: 'stream',
            title: 'Commerce Stream',
            description: 'Recommended based on your quiz results',
            score: 88
          });
        }
      });
    }
    
    // If no specific recommendations, show general ones
    if (recs.length === 0) {
      recs.push({
        type: 'general',
        title: 'Explore Career Options',
        description: 'Browse our course catalog to find your path',
        score: 85
      });
    }
    
    setRecommendations(recs);
  };

  useEffect(() => {
    // Mock upcoming events
    setUpcomingEvents([
      {
        title: 'JEE Main Registration',
        date: '2025-01-15',
        type: 'exam',
        priority: 'high'
      },
      {
        title: 'Scholarship Application',
        date: '2025-01-20',
        type: 'scholarship',
        priority: 'medium'
      }
    ]);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown')) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  const quickActions = [
    {
      title: 'Take Aptitude Quiz',
      description: 'Discover your interests and strengths',
      icon: BookOpen,
      path: '/quiz',
      color: 'from-blue-500 to-blue-600',
      completed: quizCompleted
    },
    {
      title: 'Explore Courses',
      description: 'Find courses that match your profile',
      icon: GraduationCap,
      path: '/courses',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Find Colleges',
      description: 'Browse nearby government colleges',
      icon: MapPin,
      path: '/colleges',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Timeline',
      description: 'Track important dates and deadlines',
      icon: Calendar,
      path: '/timeline',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'AI Counselor',
      description: 'Get personalized career guidance',
      icon: MessageSquare,
      path: '/chat',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
                <span className="text-lg font-semibold text-gray-800 hover:text-indigo-600 transition-colors">Zariya</span>
              </button>
              <div className="hidden md:block h-8 w-px bg-gray-300"></div>
              <h1 className="text-3xl font-bold text-gray-900 hover:text-indigo-700 transition-colors cursor-pointer">
                Dashboard
              </h1>
            </div>

            <div className="relative profile-dropdown">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center space-x-3 group cursor-pointer">
                <div className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white font-medium text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block group-hover:text-indigo-600 transition-colors">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown className="h-4 w-4 ml-1 group-hover:translate-y-1 transition-transform" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-10 animate-fade-in">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-500">{user?.class}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </button>
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              <h2 className="text-2xl font-bold mb-2 relative z-10">
                Hey {user?.firstName}, ready to explore? �
              </h2>
              <p className="text-blue-100 mb-4 relative z-10">
                {user?.class} • Interests: {user?.academicInterests?.join(', ') || 'Exploring options'} • Age {user?.age}
              </p>
              <div className="flex items-center space-x-4 relative z-10">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span className="text-sm">Profile Set</span>
                </div>
                {!quizCompleted && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-300 animate-pulse" />
                    <span className="text-sm">Quiz Awaits!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Sparkles className="h-5 w-5 text-indigo-500 mr-2" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.path}
                    className={`group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1 ${
                      index % 2 === 0 ? 'hover:rotate-1' : 'hover:-rotate-1'
                    }`}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${
                      index === 1 ? 'rounded-full' : index === 3 ? 'rounded-none' : ''
                    }`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                    <div className="flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 text-purple-500 mr-2" />
                Personalized Picks for You
              </h3>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${
                    index === 0 ? 'border-l-4 border-l-blue-500' : index === 1 ? 'border-l-4 border-l-green-500' : ''
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {rec.type === 'course' ? (
                            <GraduationCap className="h-5 w-5 text-green-500" />
                          ) : rec.type === 'stream' ? (
                            <BookOpen className="h-5 w-5 text-blue-500" />
                          ) : (
                            <MapPin className="h-5 w-5 text-purple-500" />
                          )}
                          <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium text-gray-700">{rec.score}% Match</span>
                          </div>
                          <Link
                            to={rec.type === 'course' ? '/courses' : rec.type === 'stream' ? '/courses' : '/colleges'}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            Dive In →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      event.priority === 'high' ? 'bg-red-500' :
                      event.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                      <p className="text-xs text-gray-500">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/timeline"
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Events →
              </Link>
            </div>

            {/* Progress Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative">
              <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-20"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Journey So Far</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Profile Setup</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '85%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Courses Checked Out</span>
                    <span className="font-medium">3/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-teal-600 h-2 rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Colleges Explored</span>
                    <span className="font-medium">1/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">At a Glance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">Awesome Courses</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">8</div>
                  <div className="text-sm text-gray-600">Local Colleges</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">5</div>
                  <div className="text-sm text-gray-600">Upcoming Events</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">24/7</div>
                  <div className="text-sm text-gray-600">AI Buddy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <Link to="/quiz" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Take Quiz
              </Link>
              <Link to="/courses" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Courses
              </Link>
              <Link to="/colleges" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Colleges
              </Link>
              <Link to="/timeline" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Timeline
              </Link>
              <Link to="/chat" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                AI Chat
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;