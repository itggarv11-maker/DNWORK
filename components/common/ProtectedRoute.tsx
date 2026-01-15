
import React from 'react';
import { Navigate, useLocation } from 'https://esm.sh/react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  // FIX: Replaced JSX.Element with React.ReactElement to resolve namespace error.
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Check for the dev bypass query parameter. The check needs to be on the hash part of the URL.
  const isDevBypass = new URLSearchParams(location.search || window.location.hash.split('?')[1]).get('dev') === 'true';

  if (!currentUser && !isDevBypass) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they
    // log in, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;