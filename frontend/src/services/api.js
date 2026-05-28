import axios from 'axios';

const getDefaultApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

    if (isLocalHost) {
      return 'http://localhost:5000/api';
    }
  }

  return '/api';
};

const API_URL = getDefaultApiUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Verify signup OTP and create account
  verifySignupOtp: async ({ email, otp }) => {
    const response = await api.post('/auth/verify-signup-otp', { email, otp });
    return response.data;
  },

  // Resend signup OTP
  resendSignupOtp: async (email) => {
    const response = await api.post('/auth/resend-signup-otp', { email });
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Request password reset
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password using token
  resetPassword: async ({ token, password }) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update current user profile
  updateCurrentUser: async (profileData) => {
    const response = await api.patch('/auth/me', profileData);
    return response.data;
  },

  // Change email for logged in user
  changeEmail: async ({ newEmail, currentPassword }) => {
    const response = await api.patch('/auth/me/email', { newEmail, currentPassword });
    return response.data;
  },

  // Change password for logged in user
  changePassword: async ({ currentPassword, newPassword }) => {
    const response = await api.patch('/auth/me/password', { currentPassword, newPassword });
    return response.data;
  },
};

// Chat services
export const chatService = {
  // Send message to AI
  sendMessage: async (message, signal) => {
    const response = await api.post('/chat', { message }, { signal });
    return response.data;
  },

  // Get chat history
  getChatHistory: async () => {
    const response = await api.get('/chat/history');
    return response.data;
  },
};

// Quiz services
export const quizService = {
  // Generate personalized quiz questions
  generatePersonalizedQuiz: async (userId) => {
    const response = await api.get(`/quiz/generate/${userId}`);
    return response.data;
  },

  // Submit quiz results
  submitQuiz: async (quizData) => {
    const response = await api.post('/quiz/submit', quizData);
    return response.data;
  },

  // Get user's quiz results
  getUserQuizResults: async (userId) => {
    const response = await api.get(`/quiz/results/${userId}`);
    return response.data;
  },
};

// College services
export const collegeService = {
  // Get all colleges with filters
  getColleges: async (params = {}) => {
    const response = await api.get('/colleges', { params });
    return response.data;
  },

  // Get college by ID
  getCollegeById: async (id) => {
    const response = await api.get(`/colleges/${id}`);
    return response.data;
  },

  // Get colleges by location
  getCollegesByLocation: async (lat, lng, radius = 50000) => {
    const response = await api.get('/colleges/nearby', { params: { lat, lng, radius } });
    return response.data;
  },
};

// Course services
export const courseService = {
  // Get all courses
  getCourses: async (params = {}) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  // Get course by ID
  getCourseById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  // Get course suggestions based on quiz results
  getCourseSuggestions: async (quizResults) => {
    const response = await api.post('/courses/suggestions', { quizResults });
    return response.data;
  },

  // Get career paths for a course
  getCareerPaths: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/careers`);
    return response.data;
  },
};

// Education News services
export const educationNewsService = {
  // Get education news
  // options: { limit: number (1..5), relaxed: boolean }
  getEducationNews: async (options = {}) => {
    const params = {};
    if (options.limit) params.limit = options.limit;
    if (options.relaxed) params.relaxed = options.relaxed ? '1' : '0';
    const response = await api.get('/education-news', { params });
    return response.data;
  },
};

// AI services
export const aiService = {
  // Get career matches from backend AI/GROQ proxy
  getCareerMatches: async (profile) => {
    const response = await api.post('/ai/career-matches', profile || {});
    return response.data && response.data.matches ? response.data.matches : [];
  },
};

export default api;

  // Timeline services
  export const timelineService = {
    // Get user's timeline events
    getTimeline: async (userId) => {
      const response = await api.get(`/timeline/user/${userId}`);
      return response.data;
    },

    // Get upcoming events
    getUpcomingEvents: async (userId) => {
      const response = await api.get(`/timeline/user/${userId}/upcoming`);
      return response.data;
    },

    // Create new timeline entry
    createTimelineEntry: async (timelineData) => {
      const response = await api.post('/timeline', timelineData);
      return response.data;
    },

    // Update timeline entry
    updateTimelineEntry: async (id, timelineData) => {
      const response = await api.put(`/timeline/${id}`, timelineData);
      return response.data;
    },

    // Delete timeline entry
    deleteTimelineEntry: async (id) => {
      const response = await api.delete(`/timeline/${id}`);
      return response.data;
    },
  };

// Notification services
export const notificationService = {
  // Get all notifications
  getNotifications: async (limit = 20, skip = 0) => {
    const response = await api.get('/notifications', {
      params: { limit, skip },
    });
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread/count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read/all');
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Delete all notifications
  deleteAllNotifications: async () => {
    const response = await api.delete('/notifications/all');
    return response.data;
  },

  // Create a notification (admin use)
  createNotification: async (notificationData) => {
    const response = await api.post('/notifications', notificationData);
    return response.data;
  },
};
