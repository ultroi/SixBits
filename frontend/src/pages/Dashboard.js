import React, { useState, useEffect, useRef } from 'react';
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
  LogOut,
  Zap,
  
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quizService, authService, educationNewsService } from '../services/api';

/**
 * Interactive, humanized Dashboard
 * - Adds small micro-interactions, confetti on quiz completion
 * - Skeleton loaders while fetching
 * - Keyboard shortcut (Q -> go to quiz)
 * - Accessible tooltips and ARIA labels
 * - Subtle toasts for important actions
 */

const Tooltip = ({ children, tip }) => (
  <span className="relative group">
    {children}
    {tip && (
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 z-50">
        {tip}
      </span>
    )}
  </span>
);

const Skeleton = ({ className = '' }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
);

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 bg-white shadow-lg border border-gray-200 rounded-lg px-4 py-2 flex items-center space-x-3 z-50">
    <Zap className="w-5 h-5 text-indigo-500" />
    <div className="text-sm text-gray-800">{message}</div>
    <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
      <X className="w-4 h-4" />
    </button>
  </div>
);

const ConfettiCanvas = ({ active }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const createParticle = (x, y) => {
      const colors = ['#0ea5e9', '#7c3aed', '#06b6d4', '#ef4444', '#f97316', '#f59e0b'];
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * -8 - 2,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        ttl: 80 + Math.random() * 60
      };
    };

    const spawn = (count = 30) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 4;
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(createParticle(cx + (Math.random() - 0.5) * 200, cy + (Math.random() - 0.5) * 40));
      }
    };

    let last = Date.now();
    const loop = () => {
      const now = Date.now();
      const dt = Math.min(50, now - last);
      last = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const p = particlesRef.current;
      for (let i = p.length - 1; i >= 0; i--) {
        const o = p[i];
        o.vy += 0.2 * (dt / 16);
        o.x += o.vx * (dt / 16);
        o.y += o.vy * (dt / 16);
        o.vx *= 0.99;
        o.ttl -= dt / 2;
        o.rot += 6 * (dt / 16);

        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate((o.rot * Math.PI) / 180);
        ctx.fillStyle = o.color;
        ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size);
        ctx.restore();

        if (o.y > window.innerHeight + 50 || o.ttl <= 0) {
          p.splice(i, 1);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    if (active) {
      spawn(80);
      loop();
      // Stop after some time
      setTimeout(() => {
        cancelAnimationFrame(rafRef.current);
      }, 4000);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      particlesRef.current = [];
    };
  }, [active]);

  return (
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 w-full h-full z-40" aria-hidden />
  );
};

const Dashboard = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  const [educationNews, setEducationNews] = useState([]);
  const [newsLimit] = useState(3);
  const newsTimerRef = useRef(null);

  const { logout, user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Get current user data
        const { user: currentUser } = await authService.getCurrentUser();

        // Update auth context so components relying on context immediately see the latest user
        if (currentUser && updateUser) updateUser(currentUser);

        // Check quiz completion status
        if (currentUser && currentUser._id) {
          const quizResults = await quizService.getUserQuizResults(currentUser._id);
          const hasCompletedQuiz = quizResults.quizResults && quizResults.quizResults.length > 0;

          setQuizCompleted(hasCompletedQuiz);

          if (hasCompletedQuiz) {
            const latestResult = quizResults.quizResults[quizResults.quizResults.length - 1];
            generateRecommendations(latestResult, currentUser);
            // small celebration when quiz completed just now
            setCelebrate(true);
            setTimeout(() => setCelebrate(false), 3500);
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

        // Fetch real upcoming events from API if available else fallback
        // mock upcoming events (but easily replaceable)
        setUpcomingEvents([
          {
            title: 'JEE Main Registration opens',
            date: 'Jan 15, 2025',
            type: 'exam',
            priority: 'high'
          },
          {
            title: 'Scholarship Application ends',
            date: 'Jan 20, 2025',
            type: 'scholarship',
            priority: 'medium'
          }
        ]);

        // initial education news load is handled by the auto-refresh effect (runs immediately)
      } catch (error) {
        console.error('Failed to fetch user data:', error);
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
        setToast('Could not load everything — showing best-effort data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [updateUser]);

  // Auto-refresh education news every hour
  useEffect(() => {
    const loadNews = async (limit = newsLimit, relaxed = false) => {
      try {
        const news = await educationNewsService.getEducationNews({ limit, relaxed });
        const items = Array.isArray(news) ? news : (news.articles || []);
        setEducationNews(items.slice(0, limit));
      } catch (e) {
        console.error('Failed to load news:', e);
      }
    };

    // do an immediate load now
    loadNews(newsLimit, false);

    // set interval to refresh every hour
    if (newsTimerRef.current) clearInterval(newsTimerRef.current);
    newsTimerRef.current = setInterval(() => {
      loadNews(newsLimit, false);
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      if (newsTimerRef.current) clearInterval(newsTimerRef.current);
    };
  }, [newsLimit]);

  useEffect(() => {
    const onKey = (e) => {
      // q -> go to quiz
      if (e.key.toLowerCase() === 'q') navigate('/quiz');
      // g -> go to courses
      if (e.key.toLowerCase() === 'g') navigate('/courses');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

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
    // optimistic UI: show toast then logout
    setToast('Logging you out...');
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 600);
  };

  const generateRecommendations = (quizResult, user) => {
    const recs = [];

    // Based on interests
    if (quizResult.interests && quizResult.interests.length > 0) {
      if (quizResult.interests.some(i => i.toLowerCase().includes('science'))) {
        recs.push({
          type: 'course',
          title: 'B.Tech Computer Science',
          description: `Because you liked Science and problem solving — looks like a great fit`,
          score: 95
        });
      }
      if (quizResult.interests.some(i => i.toLowerCase().includes('commerce'))) {
        recs.push({
          type: 'course',
          title: 'B.Com (Hons)',
          description: `Good for business, accounting & analytics`,
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

    // If no specific recommendations, show humanized general ones
    if (recs.length === 0) {
      recs.push({
        type: 'general',
        title: 'Explore Career Options',
        description: "Let's discover what you're good at — try the quiz or chat with the AI counselor.",
        score: 85
      });
    }

    setRecommendations(recs);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative">
      {/* Confetti when celebrate true */}
      <ConfettiCanvas active={celebrate} />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => { window.location.reload(); }}
                className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
                aria-label="Reload dashboard"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
                <span className="text-lg font-semibold text-gray-800 hover:text-indigo-600 transition-colors">Zariya</span>
              </button>

              <div className="hidden md:block h-8 w-px bg-gray-300" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 hover:text-indigo-700 transition-colors cursor-pointer">Dashboard</h1>
              <span className="ml-2 text-sm text-gray-500 hidden md:inline"></span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <Tooltip tip="Chat with AI counselor">
                  <Link to="/chat" className="text-sm px-3 py-2 rounded-md hover:bg-gray-50 transition-colors">
                    <MessageSquare className="w-5 h-5 text-indigo-500 inline-block mr-2" />
                    AI Counselor
                  </Link>
                </Tooltip>
                <Tooltip tip="Quickly go to Quiz (Press Q)">
                  <Link to="/quiz" className="text-sm px-3 py-2 rounded-md hover:bg-gray-50 transition-colors inline-flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-500" /> Take Quiz
                  </Link>
                </Tooltip>
              </div>

              <div className="relative profile-dropdown">
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center space-x-3 group cursor-pointer" aria-haspopup="true" aria-expanded={profileOpen}>
                  <div className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <span className="text-white font-medium text-sm">{user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block group-hover:text-indigo-600 transition-colors">{user?.firstName} {user?.lastName}</span>
                  <ChevronDown className="h-4 w-4 ml-1 group-hover:translate-y-1 transition-transform" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-20 animate-fade-in">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-gray-500">{user?.class || 'Student'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Bell className="h-4 w-4 mr-2" /> Notifications
                      </button>
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setToast('Settings coming soon!')}>
                        <Settings className="h-4 w-4 mr-2" /> Settings
                      </button>
                      <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Section */}
            <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-xl p-6 text-white relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Hey {user?.firstName || 'friend'}, ready to explore?</h2>
                  <p className="text-blue-100 mb-4">{user?.class || 'Class not set'} • Interests: {user?.academicInterests?.join(', ') || 'Exploring options'} • Age {user?.age || '—'}</p>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span className="text-sm">Profile Set</span>
                    </div>
                    {!quizCompleted && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-yellow-300 animate-pulse" />
                        <span className="text-sm">Quiz Awaits — try it now</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* <div className="text-right">
                  <div className="text-sm text-blue-100"></div>
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-md bg-white/10 text-white text-sm">
                    <Award className="w-4 h-4 mr-2" /> Polished UX
                  </div>
                </div> */}
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Sparkles className="h-5 w-5 text-indigo-500 mr-2" /> Quick Actions</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <Skeleton className="w-12 h-12 mb-4" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
                ) : (
                  [
                    {
                      title: 'Find Colleges',
                      description: 'Browse nearby government colleges',
                      icon: MapPin,
                      path: '/colleges',
                      color: 'from-purple-500 to-purple-600'
                    },
                    {
                      title: 'Explore Courses',
                      description: 'Find courses that match your profile',
                      icon: GraduationCap,
                      path: '/courses',
                      color: 'from-green-500 to-green-600'
                    },
                    {
                      title: 'Timeline',
                      description: 'Track important dates and deadlines',
                      icon: Calendar,
                      path: '/timeline',
                      color: 'from-orange-500 to-orange-600'
                    }
                  ].map((action, index) => (
                    <Link
                      key={index}
                      to={action.path}
                      className={`group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1 ${index % 2 === 0 ? 'hover:rotate-1' : 'hover:-rotate-1'}`}
                      aria-label={action.title}
                    >
                      <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                        <span>{action.title}</span>
                        {action.completed && <span className="text-xs text-green-600 font-medium ml-2">Done</span>}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                      <div className="flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                        <span>Get Started</span>
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            {/* Recommendations */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><MessageSquare className="h-5 w-5 text-purple-500 mr-2" /> Personalized Picks for You</h3>

              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <Skeleton className="h-4 w-1/3 mb-3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))
                ) : (
                  recommendations.map((rec, index) => (
                    <div key={index} className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${index === 0 ? 'border-l-4 border-l-blue-500' : index === 1 ? 'border-l-4 border-l-green-500' : ''}`}>
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
                            <Link to={rec.type === 'course' ? '/courses' : rec.type === 'stream' ? '/courses' : '/colleges'} className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">Dive In →</Link>
                          </div>
                        </div>

                        <div className="ml-4 hidden sm:block">
                          <div className="text-xs text-gray-400">Suggestion</div>
                          <div className="mt-2 text-sm font-semibold text-gray-800">{rec.type}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${event.priority === 'high' ? 'bg-red-500' : event.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                      <p className="text-xs text-gray-500">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/timeline" className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium">View All Events →</Link>
            </div>

            {/* Education News */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Education News</h3>
                <div className="flex items-center space-x-2">
                  <button onClick={async () => { setToast('Refreshing news...'); try { const data = await educationNewsService.getEducationNews({ limit: newsLimit }); setEducationNews(Array.isArray(data) ? data : (data.articles || [])); setToast(null); } catch (e) { console.error(e); setToast('Failed to refresh'); } }} className="ml-2 text-xs text-blue-600 hover:text-blue-700">Refresh</button>
                </div>
              </div>

              <div className="space-y-4">
                {educationNews.length > 0 ? (
                  educationNews.map((article, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{article.title}</h4>
                        <div className="text-xs text-gray-400">{article.source?.name}</div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{article.description ? article.description : (article.content ? article.content.slice(0, 120) + '...' : '')}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''}</p>
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700">Read more →</a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">No strict education headlines found right now.</p>
                    <div className="mt-2 space-x-2">
                      <button onClick={async () => {
                        try {
                          setToast('Loading broader news...');
                          const broader = await educationNewsService.getEducationNews({ relaxed: true, limit: newsLimit });
                          const items = Array.isArray(broader) ? broader : (broader.articles || broader || []);
                          setEducationNews(items.slice(0,newsLimit));
                          setToast(null);
                        } catch (e) {
                          console.error(e);
                          setToast('Failed to load broader news');
                        }
                      }} className="inline-flex items-center px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm">Show broader news</button>
                      <button onClick={async () => { setToast('Refreshing news...'); try { const data = await educationNewsService.getEducationNews({ limit: newsLimit }); setEducationNews(Array.isArray(data) ? data : (data.articles || [])); setToast(null); } catch (e) { setToast('Failed to refresh'); } }} className="inline-flex items-center px-3 py-1 rounded bg-gray-50 text-gray-700 text-sm">Retry strict</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <Link to="/quiz" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Take Quiz</Link>
              <Link to="/courses" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Courses</Link>
              <Link to="/colleges" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Colleges</Link>
              <Link to="/timeline" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Timeline</Link>
              <Link to="/chat" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">AI Chat</Link>
              <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md">Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Dashboard;
