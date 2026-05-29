import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
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
  TrendingUp,
  Brain,
  Search,
  Menu,
  Home,
  Book,
  Award,
  Target,
  Briefcase,
  Building2,
  MapPin,
  Globe,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService, timelineService, notificationService } from '../services/api';
import NotificationPanel from '../components/NotificationPanel';

// Toast Component
const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 bg-white shadow-lg border border-gray-200 rounded-xl px-4 py-3 flex items-center space-x-3 z-50 animate-slide-up">
    <Zap className="w-5 h-5 text-purple-600" />
    <div className="text-sm text-gray-800 font-medium">{message}</div>
    <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
      <X className="w-4 h-4" />
    </button>
  </div>
);

const Avatar = ({ user, sizeClassName, initialsClassName, fallbackText = 'U' }) => {
  const [imageError, setImageError] = useState(false);
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || fallbackText;

  if (user?.avatarUrl && !imageError) {
    return (
      <img
        src={user.avatarUrl}
        alt={`${user?.firstName || 'User'} avatar`}
        className={`rounded-full object-cover ${sizeClassName}`}
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className={`rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold ${sizeClassName} ${initialsClassName}`}>
      {initials}
    </div>
  );
};

const heroContainerVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: 'easeOut',
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// Sidebar Navigation Component
const SidebarNav = ({ isOpen, onClose, profileCompletion = 5 }) => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard', badge: null },
    { icon: Brain, label: 'AI Counselor', path: '/chat', badge: 'NEW' },
    { icon: Target, label: 'Career Assessment', path: '/quiz', badge: null },
    { icon: TrendingUp, label: 'Recommended Paths', path: '/courses', badge: null },
    { icon: Building2, label: 'Colleges Explorer', path: '/colleges', badge: null },
    { icon: Book, label: 'Courses', path: '/courses', badge: null },
    { icon: Calendar, label: 'Exams & Timeline', path: '/timeline', badge: null },
    { icon: Star, label: 'Saved Items', path: '/dashboard', badge: null },
    { icon: MessageCircle, label: 'WhatsApp Alerts', path: '/dashboard', badge: null },
    { icon: Settings, label: 'Settings', path: '/settings', badge: null },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white/95 backdrop-blur-md border-r border-gray-200 shadow-lg transition-transform duration-300 z-50 md:z-30 md:translate-x-0 flex flex-col overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="p-3 border-b border-gray-100 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ZARIYA
              </div>
              <div className="text-[10px] text-gray-600 font-medium">Your Career. Our Guidance.</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto hide-scrollbar">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              onClick={onClose}
              className="group flex items-center justify-between px-3 py-2 rounded-xl text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-4 h-4 group-hover:text-purple-600 transition-colors" />
                <span className="text-[12px] font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] bg-gradient-to-r from-purple-600 to-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Cards */}
        <div className="p-2.5 space-y-2 border-t border-gray-100 bg-gradient-to-t from-gray-50">
          {/* Profile Completion Card */}
          <div className="bg-white rounded-xl p-2.5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-900">Profile Completion</h4>
              <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-[10px] font-bold text-purple-600">{profileCompletion}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
              <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full" style={{ width: `${profileCompletion}%` }}></div>
            </div>
            <Link
              to="/settings"
              onClick={onClose}
              className="block w-full text-center bg-purple-100 text-purple-700 text-[10px] font-bold py-1 rounded-lg hover:bg-purple-200 transition-colors"
            >
              Complete Profile
            </Link>
          </div>

          {/* Help Card */}
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-2.5 text-white shadow-lg hover:shadow-xl transition-shadow">
            <p className="text-xs font-bold mb-1">Need Help?</p>
            <p className="text-[10px] text-purple-100 mb-2">Chat with our AI counselor</p>
            <Link
              to="/chat"
              onClick={onClose}
              className="block w-full text-center bg-white text-purple-600 text-[10px] font-bold py-1 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Chat Now
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

const Dashboard = () => {
  const { logout, user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bannerToast, setBannerToast] = useState(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState('EN');
  const [loading, setLoading] = useState(true);
  
  // Notification state
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const careerMatchScore = 89;
  const topCareerMatches = [
    { title: 'BCA', percent: 91, match: 'High Match' },
    { title: 'B.Sc Computer Science', percent: 86, match: 'High Match' },
    { title: 'Data Science & Analytics', percent: 78, match: 'Good Match' },
  ];
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const recommendedCareers = [
    {
      title: 'Software Developer',
      path: 'BCA → Internship → SDE → Tech Lead',
      salary: '6–12 LPA',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Data Analyst',
      path: 'B.Sc CS → Analytics Tools → Analyst',
      salary: '7.5–9 LPA',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Government Officer',
      path: 'Graduation → UPSC/RPSC → Officer',
      salary: '10–15 LPA',
      color: 'from-purple-500 to-purple-600',
    },
  ];
  const collegeMatches = [
    {
      name: 'Govt. Maharaja College',
      location: 'Jaipur, Rajasthan',
      courses: 'B.Sc CS, BCA, B.Comm',
      percent: 92,
    },
    {
      name: 'Delhi University',
      location: 'New Delhi',
      courses: 'BA, B.Sc, B.Tech',
      percent: 88,
    },
    {
      name: 'IIT Bombay',
      location: 'Mumbai, Maharashtra',
      courses: 'B.Tech, Dual Degree',
      percent: 85,
    },
  ];
  const keyStrengths = [
    { icon: Brain, label: 'Analytical Thinking' },
    { icon: Target, label: 'Problem Solving' },
    { icon: Zap, label: 'Technical Aptitude' },
    { icon: Award, label: 'Learning Agility' },
    { icon: Sparkles, label: 'Logical Reasoning' },
  ];
  const profileSections = [
    { label: 'Basic Information', completed: !!user?.firstName && !!user?.lastName && !!user?.email },
    { label: 'Academic Details', completed: !!user?.class && !!user?.stream },
    { label: 'Career Interests', completed: user?.careerAspirations && user.careerAspirations.length > 0 },
    { label: 'Aptitude Assessment', completed: user?.quizResults && user.quizResults.length > 0 },
    { label: 'Location & Profile', completed: !!user?.location?.city && !!user?.location?.state },
  ];
  const profileProgress = Math.round((profileSections.filter(s => s.completed).length / profileSections.length) * 100);
  const personalizedRecs = [
    { title: 'Top Colleges for Science', subtitle: 'Based on your score & location' },
    { title: 'Best Scholarships for You', subtitle: '8 scholarships you are eligible for' },
    { title: 'Skills to Learn Next', subtitle: 'Boost your profile with in-demand skills' },
    { title: 'Internships for You', subtitle: 'Recommended internships near you' },
  ];
  const educationNews = [
    { title: 'Top Engineering Colleges Cut Off 2025', source: 'Education Times' },
    { title: 'New Scholarship Schemes for SC/ST Students', source: 'The Hindu' },
    { title: '5 Best Programming Languages to Learn in 2025', source: 'Tech Radar' },
  ];

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { user: currentUser } = await authService.getCurrentUser();
        if (currentUser && updateUser) {
          updateUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };

    loadDashboardData();
  }, [updateUser]);

  useEffect(() => {
    const loadUpcoming = async () => {
      try {
        if (!user || !user._id) return;
        const data = await timelineService.getUpcomingEvents(user._id);
        // Expecting an array in response; fallback to empty array
        setUpcomingEvents(Array.isArray(data) ? data : (data?.events || []));
      } catch (err) {
        console.error('Failed to load upcoming events:', err);
        setUpcomingEvents([]);
      }
    };

    loadUpcoming();
  }, [user]);

  const handleLogout = () => {
    setProfileOpen(false);
    setBannerToast('Logging you out...');
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 600);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown')) {
        setProfileOpen(false);
      }
      if (!event.target.closest('.language-switcher')) {
        setLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load notifications when panel opens
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await notificationService.getNotifications(20, 0);
      if (response.success) {
        setNotifications(response.data || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Handle notification bell click
  const handleNotificationBellClick = () => {
    setNotificationPanelOpen(true);
    fetchNotifications();
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      // Remove from local state
      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Sidebar */}
      <SidebarNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} profileCompletion={profileProgress} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm md:ml-64">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Left */}
            <div className="flex items-center space-x-4 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="hidden md:flex items-center bg-gray-100/60 hover:bg-gray-100 border border-gray-200/50 rounded-2xl px-4 py-3 space-x-3 flex-1 max-w-xs transition-all h-12">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search courses, colleges, exams..."
                  className="bg-transparent outline-none text-sm w-full placeholder-gray-400 font-medium"
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Language Switcher */}
              <div className="relative language-switcher">
                <button
                  onClick={() => setLanguageOpen(!languageOpen)}
                  className="flex items-center space-x-1 px-2 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-[11px] font-medium"
                >
                  <Globe className="w-3 h-3" />
                  <span className="hidden sm:inline">{language}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {languageOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
                    <button
                      onClick={() => {
                        setLanguage('EN');
                        setLanguageOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors first:rounded-t-xl"
                    >
                      English
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('हिंदी');
                        setLanguageOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors last:rounded-b-xl"
                    >
                      हिंदी
                    </button>
                  </div>
                )}
              </div>

              {/* Notification */}
              <button
                type="button"
                onClick={handleNotificationBellClick}
                className="relative p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Profile */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-2 group hover:bg-gray-50 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <Avatar
                    user={user}
                    sizeClassName="w-7 h-7 shadow-md text-[11px]"
                    initialsClassName=""
                    fallbackText="AK"
                  />
                  <div className="hidden sm:block text-right">
                    <div className="text-[11px] font-semibold text-gray-900">{user?.firstName || 'Akshay'}</div>
                    <div className="text-[10px] text-gray-500">Student</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                    {/* Profile Header */}
                    <div className="p-2.5 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          user={user}
                          sizeClassName="w-9 h-9 shadow-md text-xs"
                          initialsClassName=""
                          fallbackText="U"
                        />
                        <div>
                          <p className="text-[11px] font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
                          <p className="text-[10px] text-gray-600">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-1.5 text-xs text-gray-700 hover:bg-purple-50 transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Settings className="h-3 w-3 mr-3 text-gray-400" />
                        Settings & Privacy
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200"
                      >
                        <LogOut className="h-3 w-3 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-64 px-3.5 sm:px-5 lg:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{user?.firstName || 'Akshay'}</span>!
            </h1>
            <p className="text-gray-600 mt-1 text-xs">Let''s continue your personalized career journey.</p>
          </div>

          {/* Hero Section - Career Match - Premium 2026 Redesign */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={heroContainerVariants}
            className="mb-6 relative h-[340px] w-full overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#4F46E5_0%,#5B4CF4_25%,#6D5CF8_55%,#7C3AED_100%)] px-10 py-8 text-white shadow-[0_30px_80px_rgba(79,70,229,0.35)]"
          >
            {/* Enhanced Layered Background */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(255,255,255,0.25),transparent_25%),radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.16),transparent_18%),radial-gradient(circle_at_50%_115%,rgba(34,211,238,0.18),transparent_24%)]" />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-16px_36px_rgba(0,0,0,0.12)]" />
            
            {/* Animated Floating Light Blobs */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute left-12 top-8 h-20 w-20 rounded-full bg-white/12 blur-3xl"
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.12, 1], x: [0, 8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute right-16 top-12 h-24 w-24 rounded-full bg-cyan-200/12 blur-3xl"
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.15, 1], y: [0, -12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-6 left-1/4 h-28 w-28 rounded-full bg-violet-200/10 blur-3xl"
              animate={{ opacity: [0.15, 0.4, 0.15], scale: [1, 1.18, 1], x: [0, -10, 0] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative z-10 flex h-full items-center gap-8">
              {/* Left Score Card - Premium 2026 Design */}
              <motion.div variants={heroItemVariants} className="flex flex-none items-center justify-center" style={{ width: '200px' }}>
                <div className="relative flex h-[210px] w-[170px] flex-col items-center justify-center rounded-[28px] border border-white/[0.28] bg-white/[0.11] px-5 py-6 backdrop-blur-[24px] shadow-[0_20px_48px_rgba(14,20,80,0.16)]">
                  {/* Glow background */}
                  <motion.div
                    className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.08] to-transparent opacity-0"
                    animate={{ opacity: [0, 0.4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  
                  {/* Animated glow blob inside */}
                  <motion.div
                    className="absolute h-[140px] w-[140px] rounded-full bg-cyan-300/15 blur-2xl"
                    animate={{ 
                      opacity: [0.4, 0.8, 0.4], 
                      scale: [0.95, 1.08, 0.95]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  <div className="relative text-center">

                    <svg width="140" height="140" viewBox="0 0 140 140" className="relative -rotate-90 drop-shadow-[0_0_24px_rgba(165,243,252,0.35)]">
                      <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12" />
                      <motion.circle
                        cx="70"
                        cy="70"
                        r="58"
                        fill="none"
                        stroke="url(#heroPremiumGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(careerMatchScore / 100) * 2 * Math.PI * 58} ${2 * Math.PI * 58}`}
                        initial={{ strokeDashoffset: 32 }}
                        animate={{ strokeDashoffset: [32, 0, 32] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <defs>
                        <linearGradient id="heroPremiumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#A5F3FC" stopOpacity="1" />
                          <stop offset="50%" stopColor="#93C5FD" stopOpacity="0.95" />
                          <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.9" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <motion.div
                        className="text-[36px] md:text-[40px] font-extrabold leading-none tracking-[-0.02em] text-white text-center"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {careerMatchScore}%
                      </motion.div>
                      <div className="mt-1 text-xs font-medium text-white/90 text-center">Great Match</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Center Matches Section - Enhanced Layout */}
              <motion.div variants={heroItemVariants} className="min-w-0 flex-1">
                <div className="mb-8">
                  <h2 className="text-[22px] md:text-[28px] font-bold leading-tight text-white">Your Top Career Matches</h2>
                  <p className="mt-3 text-sm text-white/70">Based on your profile, interests & assessment</p>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((idx) => (
                        <div key={idx} className="h-[56px] rounded-2xl bg-white/10 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    topCareerMatches.map((career, idx) => (
                      <motion.div
                        key={idx}
                        variants={heroItemVariants}
                        whileHover={{ y: -2, scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                        className="group flex h-[56px] items-center gap-4 rounded-2xl border border-white/[0.18] bg-white/[0.13] px-5 py-4 backdrop-blur-[16px] transition-all hover:border-white/[0.24] hover:bg-white/[0.16]"
                      >
                        <div className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-full bg-white/[0.22] text-[14px] font-bold text-white shadow-[0_0_16px_rgba(165,243,252,0.2)]">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-lg font-semibold text-white">{career.title}</p>
                          <p className="text-xs text-white/65">{career.match}</p>
                        </div>
                        <motion.div
                          className="shrink-0 rounded-full border border-white/[0.22] bg-[#93C5FD]/[0.28] px-5 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(147,197,253,0.28)]"
                          whileHover={{ scale: 1.05 }}
                        >
                          {career.percent}%
                        </motion.div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Right Illustration - Clean Vertical Career Roadmap */}
              <motion.div variants={heroItemVariants} className="relative hidden lg:flex flex-none items-center justify-center" style={{ width: '160px' }}>
                <div className="relative h-full w-20 flex flex-col items-center justify-center">
                  {/* Animated vertical connecting line */}
                  <svg width="100%" height="100%" viewBox="0 0 80 280" className="absolute inset-0 pointer-events-none">
                    <defs>
                      <linearGradient id="verticalRoadmapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#A5F3FC" stopOpacity="1" />
                        <stop offset="50%" stopColor="#93C5FD" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.6" />
                      </linearGradient>
                      <filter id="verticalGlow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    {/* Vertical animated line */}
                    <motion.line
                      x1="40" y1="25" x2="40" y2="255"
                      stroke="url(#verticalRoadmapGradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      filter="url(#verticalGlow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2, ease: 'easeInOut' }}
                    />
                  </svg>

                  {/* Quiz - Top */}
                  <motion.div
                    className="relative flex flex-col items-center mb-6"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                  >
                    <motion.div
                      className="h-9 w-9 rounded-full border-2 border-white/50 bg-white/[0.16] backdrop-blur-md flex items-center justify-center shadow-[0_0_12px_rgba(165,243,252,0.4)]"
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Zap className="h-4 w-4 text-white" />
                    </motion.div>
                    <div className="mt-2 text-xs font-semibold text-white/80">Quiz</div>
                  </motion.div>

                  {/* Skills */}
                  <motion.div
                    className="relative flex flex-col items-center mb-6"
                    animate={{ y: [0, 2, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                  >
                    <motion.div
                      className="h-9 w-9 rounded-full border-2 border-white/50 bg-white/[0.16] backdrop-blur-md flex items-center justify-center shadow-[0_0_12px_rgba(147,197,253,0.4)]"
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    >
                      <Brain className="h-4 w-4 text-white" />
                    </motion.div>
                    <div className="mt-2 text-xs font-semibold text-white/80">Skills</div>
                  </motion.div>

                  {/* College */}
                  <motion.div
                    className="relative flex flex-col items-center mb-6"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                  >
                    <motion.div
                      className="h-9 w-9 rounded-full border-2 border-white/50 bg-white/[0.16] backdrop-blur-md flex items-center justify-center shadow-[0_0_12px_rgba(196,181,253,0.4)]"
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                    >
                      <Building2 className="h-4 w-4 text-white" />
                    </motion.div>
                    <div className="mt-2 text-xs font-semibold text-white/80">College</div>
                  </motion.div>

                  {/* Career - Bottom */}
                  <motion.div
                    className="relative flex flex-col items-center"
                    animate={{ y: [0, 2, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                  >
                    <motion.div
                      className="h-10 w-10 rounded-full border-2 border-white/60 bg-gradient-to-br from-white/[0.25] to-white/[0.1] backdrop-blur-md flex items-center justify-center shadow-[0_0_16px_rgba(165,243,252,0.5)]"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
                    >
                      <Briefcase className="h-5 w-5 text-white" />
                    </motion.div>
                    <div className="mt-2 text-xs font-bold text-white">Career</div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* LEFT COLUMN - 2/3 width */}
            <div className="lg:col-span-2 space-y-5">
              {/* Quick Actions */}
              <motion.div 
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 transition-all"
                whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-bold text-gray-900 mb-5">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                  {[
                    {
                      icon: Brain,
                      title: 'AI Counselor',
                      subtitle: 'Ask anything about career & exams',
                      path: '/chat',
                      color: 'from-purple-500 to-indigo-600',
                    },
                    {
                      icon: Target,
                      title: 'Take New Quiz',
                      subtitle: 'Discover your aptitude',
                      path: '/quiz',
                      color: 'from-emerald-500 to-teal-600',
                    },
                    {
                      icon: Building2,
                      title: 'Explore Colleges',
                      subtitle: 'Find best-fit colleges near you',
                      path: '/colleges',
                      color: 'from-blue-500 to-cyan-600',
                    },
                    {
                      icon: Book,
                      title: 'Explore Courses',
                      subtitle: 'Discover courses that fit you',
                      path: '/courses',
                      color: 'from-amber-500 to-orange-600',
                    },
                    {
                      icon: TrendingUp,
                      title: 'Career Roadmap',
                      subtitle: 'View your personalized career path',
                      path: '/courses',
                      color: 'from-violet-500 to-purple-600',
                    },
                  ].map((action, idx) => (
                    <Link
                      key={idx}
                      to={action.path}
                      className="group/action bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover/action:scale-110 transition-transform shadow-lg`}
                      >
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-xs text-gray-900 mb-0.5 group-hover/action:text-purple-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-[10px] text-gray-600 leading-snug">{action.subtitle}</p>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Key Strengths */}
              <motion.div 
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 transition-all"
                whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-bold text-gray-900 mb-5">Your Key Strengths</h2>
                {loading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div
                        key={idx}
                        className="h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl animate-pulse"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {keyStrengths.map((strength, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-center text-center p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100 hover:shadow-md hover:border-purple-300 transition-all duration-300 group/strength"
                      >
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-2 shadow-sm group-hover/strength:scale-110 transition-transform">
                          <strength.icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-[10px] leading-tight">{strength.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recommended Career Paths */}
              <motion.div 
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 transition-all"
                whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-bold text-gray-900 mb-5">Recommended Career Paths</h2>
                <div className="space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((idx) => (
                        <div key={idx} className="h-14 bg-gray-100 rounded-xl animate-pulse"></div>
                      ))}
                    </div>
                  ) : (
                    recommendedCareers.map((pathway, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 hover:shadow-md hover:border-purple-200 transition-all duration-300 group/pathway"
                      >
                        <div
                          className={`w-9 h-9 bg-gradient-to-br ${pathway.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover/pathway:scale-110 transition-transform`}
                        >
                          <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xs text-gray-900">{pathway.title}</h3>
                          <p className="text-[10px] text-gray-600 mt-0.5 leading-snug">{pathway.path}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-xs text-gray-900">{pathway.salary}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Avg. Salary</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Best College Matches */}
              <motion.div 
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 transition-all"
                whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-bold text-gray-900 mb-5">Best College Matches</h2>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="h-14 bg-gray-100 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collegeMatches.map((college, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:shadow-lg hover:border-blue-300 transition-all group/college"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-xs text-gray-900 group-hover/college:text-purple-600 transition-colors">
                            {college.name}
                          </h3>
                          <p className="text-[10px] text-gray-600 mt-0.5 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{college.location}</span>
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">{college.courses}</p>
                        </div>
                        <div className="mt-3 sm:mt-0 text-right">
                          <div className="inline-block px-2.5 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-[10px] font-bold">
                            {college.percent}% Match
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* RIGHT COLUMN - 1/3 width */}
            <div className="space-y-4">
              {/* Upcoming Events */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-base font-bold text-gray-900 mb-3">Upcoming Deadlines</h3>
                {loading ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(!upcomingEvents || upcomingEvents.length === 0) ? (
                      <div className="text-sm text-gray-500">No upcoming deadlines</div>
                    ) : (
                      upcomingEvents.slice(0, 4).map((event, idx) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group/event"
                        >
                          <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5 group-hover/event:scale-110 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-[11px] truncate">
                              {event.title}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{event.date}</p>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg whitespace-nowrap flex-shrink-0 ${
                              event.type === 'Exam'
                                ? 'bg-blue-100 text-blue-700'
                                : event.type === 'Admission'
                                ? 'bg-red-100 text-red-700'
                                : event.type === 'Scholarship'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {event.type}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
                <Link
                  to="/timeline"
                  className="mt-2 inline-flex items-center text-[10px] font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                >
                  View all <ArrowRight className="w-3 h-3 ml-2" />
                </Link>
              </div>

              {/* Personalized Recommendations */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-base font-bold text-gray-900 mb-3">For You</h3>
                {loading ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className="h-10 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl animate-pulse"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {personalizedRecs.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl cursor-pointer hover:shadow-md hover:from-purple-100 hover:to-blue-100 transition-all group/rec border border-purple-100"
                      >
                        <h4 className="font-bold text-[11px] text-gray-900 group-hover/rec:text-purple-700 transition-colors">
                          {rec.title}
                        </h4>
                        <p className="text-[10px] text-gray-600 mt-0.5">{rec.subtitle}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Education News */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Education News</span>
                </h3>
                {loading ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="h-8 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {educationNews.map((news, idx) => (
                      <div
                        key={idx}
                        className="pb-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 -mx-3 px-3 py-1.5 rounded-lg transition-colors group/news"
                      >
                        <p className="font-semibold text-gray-900 text-[11px] line-clamp-2 group-hover/news:text-purple-600 transition-colors">
                          {news.title}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{news.source}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Profile Progress */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-bold text-gray-900 mb-3 text-center">Your Progress</h3>
                <div className="flex flex-col items-center justify-center">
                  <div className="relative h-20 w-20 flex items-center justify-center mb-4">
                  <svg width={80} height={80} className="transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="5"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="url(#profileGrad)"
                      strokeWidth="5"
                      strokeDasharray={`${(profileProgress / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="profileGrad">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </svg>
                    <div className="absolute text-center">
                      <div className="text-sm font-bold text-gray-900 text-center">{profileProgress}%</div>
                      <div className="text-[9px] text-gray-500 mt-0.5 text-center">Complete</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 w-full px-2">
                    {profileSections.map((section, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs">
                        {section.completed ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        )}
                        <span className={`font-medium leading-tight text-left ${section.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                          {section.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to="/settings"
                  className="mt-3 w-full py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold text-[10px] hover:shadow-lg transition-all text-center block"
                >
                  Complete Profile
                </Link>
              </div>

              {/* AI Counselor CTA */}
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-3 text-white shadow-lg hover:shadow-xl transition-shadow group/cta">
                <div className="flex items-start space-x-2.5 mb-2.5">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover/cta:bg-white/30 transition-colors">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Need Help?</h3>
                    <p className="text-purple-100 text-[10px] mt-0.5">
                      Chat with our AI counselor for instant guidance
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-purple-100 mb-2.5 leading-snug">
                  Get answers about careers, colleges, exams, scholarships & more in seconds.
                </p>
                <Link
                  to="/chat"
                  className="block w-full bg-white text-purple-600 font-bold py-1.5 rounded-lg hover:bg-purple-50 transition-all text-center text-[10px]"
                >
                  Start Conversation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {bannerToast && (
        <Toast message={bannerToast} onClose={() => setBannerToast(null)} />
      )}

      {/* Custom Animations */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={handleMarkAsRead}
        onDeleteNotification={handleDeleteNotification}
        isLoading={notificationsLoading}
      />
    </div>
  );
};

export default Dashboard;
