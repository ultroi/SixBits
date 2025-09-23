import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

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
    const token = localStorage.getItem('token');
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

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Chat services
export const chatService = {
  // Send message to AI
  sendMessage: async (message) => {
    const response = await api.post('/chat', { message });
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

export default api;
