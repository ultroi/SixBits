import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    toast.error('Please login to access this page');
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default PrivateRoute;
