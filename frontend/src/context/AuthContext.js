import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const getActiveStorage = () => (localStorage.getItem('token') ? localStorage : sessionStorage);

  const clearAuthStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  // Check if user is logged in on page load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = getToken();
        if (token) {
          const { user } = await authService.getCurrentUser();
          setUser(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear storage if token is invalid
        clearAuthStorage();
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const { rememberMe = true, ...loginCredentials } = credentials;
      const data = await authService.login(loginCredentials);
      const storage = rememberMe ? localStorage : sessionStorage;
      
      // Save token and user in the selected storage
      storage.setItem('token', data.token);
      storage.setItem('user', JSON.stringify(data.user));

      if (rememberMe) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      const errorMsg = error.response?.data?.message || 'Login failed';
      toast.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user in context and localStorage (useful when other components fetch latest user)
  const updateUser = useCallback((newUser) => {
    setUser(newUser);
    if (newUser) {
      getActiveStorage().setItem('user', JSON.stringify(newUser));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      setIsAuthenticated(false);
    }
  }, []);

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const data = await authService.register(userData);
      toast.success(data.message || 'OTP sent to your email.');
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMsg = error.response?.data?.message || 'Registration failed';
      toast.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    clearAuthStorage();
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        updateUser,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
