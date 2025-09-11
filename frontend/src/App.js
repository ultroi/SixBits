import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ChatInterface from './pages/ChatInterface';
import AptitudeQuiz from './pages/AptitudeQuiz';
import CourseExplorer from './pages/CourseExplorer';
import CollegeDirectory from './pages/CollegeDirectory';
import TimelineManager from './pages/TimelineManager';
import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated, loading } = useAuth();

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <Login />
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <Signup />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/quiz" 
          element={
            <PrivateRoute>
              <AptitudeQuiz />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/courses" 
          element={
            <PrivateRoute>
              <CourseExplorer />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/colleges" 
          element={
            <PrivateRoute>
              <CollegeDirectory />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/timeline" 
          element={
            <PrivateRoute>
              <TimelineManager />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/chat" 
          element={
            <PrivateRoute>
              <ChatInterface />
            </PrivateRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
