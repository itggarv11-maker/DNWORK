

import React, { useState, useRef, useEffect } from 'react';
// FIX: Using esm.sh for react-router-dom to resolve module loading errors.
import { NavLink, Link, useLocation, useNavigate } from 'https://esm.sh/react-router-dom@6';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { 
    ArrowLeftOnRectangleIcon, AcademicCapIcon, UserCircleIcon, SparklesIcon,
    MenuIcon, XMarkIcon
} from '../icons';

const Header: React.FC = () => {
  const { currentUser, logout, loading, tokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [location]);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const linkClass = "text-slate-700 hover:text-black transition-colors duration-300 px-3 py-2 rounded-md font-semibold text-base flex items-center gap-1.5";
  const activeLinkClass = "text-black";
  const mobileLinkClass = "text-slate-700 hover:bg-slate-100 block px-4 py-3 rounded-md text-base font-semibold";

  const renderLogo = () => (
    <NavLink to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
        <div className="bg-gradient-to-br from-violet-600 to-pink-500 p-2 rounded-lg shadow-lg">
            <AcademicCapIcon className="h-7 w-7 text-white" />
        </div>
        <div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-violet-700">StuBro AI</span>
            <div className="text-xs text-slate-500 -mt-1 font-poppins">
                by Garv
            </div>
        </div>
    </NavLink>
  );

  const renderDesktopNav = () => {
    if (loading) return <Spinner className="w-5 h-5" colorClass="bg-slate-800" />;
    if (currentUser) {
      return (
        <>
          <NavLink to="/app" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Dashboard</NavLink>
          <Link to="/premium" className={`${linkClass} !text-violet-600`}><SparklesIcon className="w-4 h-4"/> Premium</Link>
          <div className="flex items-center gap-2 bg-slate-200/50 rounded-full px-3 py-1.5 text-sm">
             <span className="font-bold text-slate-600">Tokens: {tokens ?? '...'}</span>
          </div>
          <NavLink to="/profile" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}><UserCircleIcon className="w-4 h-4"/> Profile</NavLink>
          <Button onClick={handleLogout} variant="outline" size="sm"><ArrowLeftOnRectangleIcon className="w-4 h-4" />Logout</Button>
        </>
      );
    }
    if (location.pathname === '/') {
      return (
        <>
          <a href="#features" className={linkClass}>Features</a>
          <Link to="/premium" className={`${linkClass} !text-violet-600`}><SparklesIcon className="w-4 h-4"/> Premium</Link>
          <Link to="/login"><Button variant='outline' size="md" className="font-semibold">Login</Button></Link>
          <Link to="/signup"><Button variant='primary' size="md" className="font-semibold">Get Started</Button></Link>
        </>
      );
    }
    return (
      <>
        <NavLink to="/" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Home</NavLink>
        <Link to="/premium" className={`${linkClass} !text-violet-600`}><SparklesIcon className="w-4 h-4"/> Premium</Link>
        <Link to="/login"><Button variant='outline' size="sm">Login</Button></Link>
        <Link to="/signup"><Button variant='primary' size="sm">Sign Up</Button></Link>
      </>
    );
  };
  
  const renderMobileNav = () => {
    if (loading) return <Spinner className="w-5 h-5" colorClass="bg-slate-800" />;
    if (currentUser) {
      return (
          <>
            <NavLink to="/app" className={mobileLinkClass}>Dashboard</NavLink>
            <NavLink to="/profile" className={mobileLinkClass}>Profile</NavLink>
            <Link to="/premium" className={`${mobileLinkClass} !text-violet-600`}>Premium</Link>
            <div className="px-4 py-3">
              <Button onClick={handleLogout} variant="outline" size="md" className="w-full">Logout</Button>
            </div>
          </>
      );
    }
    return (
        <>
          <NavLink to="/" className={mobileLinkClass}>Home</NavLink>
          <a href="/#features" onClick={() => setIsMobileMenuOpen(false)} className={mobileLinkClass}>Features</a>
          <Link to="/premium" className={`${mobileLinkClass} !text-violet-600`}>Premium</Link>
           <div className="px-4 py-3 flex flex-col gap-3">
            <Link to="/login"><Button variant='outline' size="md" className="w-full">Login</Button></Link>
            <Link to="/signup"><Button variant='primary' size="md" className="w-full">Get Started</Button></Link>
          </div>
        </>
    );
  };

  return (
    <header className="relative z-50 bg-transparent py-2">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {renderLogo()}
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-1 md:space-x-4">
          {renderDesktopNav()}
        </div>
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2">
            <MenuIcon className="w-6 h-6 text-slate-800" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
       <div className={`fixed inset-0 bg-white z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              {renderLogo()}
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                <XMarkIcon className="w-6 h-6 text-slate-800" />
              </button>
            </div>
            <nav className="flex flex-col p-4 space-y-2">
              {renderMobileNav()}
            </nav>
        </div>
    </header>
  );
};

export default Header;