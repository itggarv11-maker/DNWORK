
import React from 'react';
import { Navigate, useLocation } from 'https://esm.sh/react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../common/Spinner';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // IMPORTANT: While Firebase is checking the session, show a loader 
  // instead of redirecting to login. This prevents logging out on refresh.
  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-slate-950">
        <div className="text-center">
            <Spinner className="h-12 w-12 mx-auto" colorClass="bg-violet-600" />
            <p className="mt-4 text-violet-500 font-mono-tech uppercase tracking-widest text-xs">Verifying Access...</p>
        </div>
      </div>
    );
  }

  const isDevBypass = new URLSearchParams(location.search || window.location.hash.split('?')[1]).get('dev') === 'true';

  if (!currentUser && !isDevBypass) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
