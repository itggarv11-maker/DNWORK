
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'https://esm.sh/react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { ArrowLeftOnRectangleIcon } from '../icons/ArrowLeftOnRectangleIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { UserCircleIcon } from '../icons/UserCircleIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { 
    BrainCircuitIcon, CalendarIcon, RocketLaunchIcon, DocumentDuplicateIcon, 
    ChatBubbleLeftRightIcon, MicrophoneIcon, VideoCameraIcon, GavelIcon, QuestIcon 
} from '../icons';

const Header: React.FC = () => {
  const { currentUser, logout, loading, tokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    const handleScroll = () => {
        setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Unified Dark Glass Header Style
  const headerClasses = `fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 shadow-lg' : 'bg-transparent'}`;
  const linkClass = "text-slate-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-md font-medium text-sm flex items-center gap-1.5";
  const activeLinkClass = "bg-slate-800/50 text-white shadow-inner";

  const renderLogo = () => (
    <NavLink to="/" className="flex items-center gap-3 group">
        <div className="relative">
             <div className="absolute inset-0 bg-violet-600 rounded-lg blur opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
             <div className="relative bg-gradient-to-br from-violet-600 to-indigo-600 p-2 rounded-lg shadow-xl border border-white/10">
                <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
        </div>
        <div>
            <span className="text-xl font-bold text-white tracking-tight block leading-none">StuBro<span className="text-violet-400">AI</span></span>
            <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 tracking-[0.2em] uppercase block mt-0.5 hover:tracking-[0.3em] transition-all duration-300 cursor-default">Made by Garv</span>
        </div>
    </NavLink>
  );
  
  const renderNavLinks = () => {
    if (loading) return <Spinner className="w-5 h-5" colorClass="bg-white" />;

    if (currentUser) {
      return (
        <>
          <NavLink to="/app" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>
            Dashboard
          </NavLink>
          
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`${linkClass} ${dropdownOpen ? 'text-white' : ''}`}>
              Tools <ChevronDownIcon className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl bg-slate-900 border border-slate-700 ring-1 ring-black ring-opacity-50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="py-1 grid gap-1 p-2">
                   <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Access</div>
                  <Link to="/chapter-conquest" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 rounded-lg transition-colors">
                    <QuestIcon className="w-4 h-4" /> Chapter Conquest
                  </Link>
                  <Link to="/live-debate" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 rounded-lg transition-colors">
                    <GavelIcon className="w-4 h-4" /> Live Debate
                  </Link>
                  <Link to="/mind-map" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 rounded-lg transition-colors">
                    <BrainCircuitIcon className="w-4 h-4" /> Mind Maps
                  </Link>
                  <Link to="/study-planner" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 rounded-lg transition-colors">
                    <CalendarIcon className="w-4 h-4" /> Study Planner
                  </Link>
                  <Link to="/gemini-live" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 rounded-lg transition-colors">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" /> Live Doubts
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link to="/premium" className={`${linkClass} !text-amber-400 hover:!text-amber-300`}>
              <SparklesIcon className="w-4 h-4"/> Premium
          </Link>
          
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-full px-3 py-1">
             <span className="text-xs font-bold text-slate-400">Tokens:</span>
             <span className="text-xs font-mono text-white">{tokens ?? '...'}</span>
          </div>
          
          <NavLink to="/profile" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>
              <UserCircleIcon className="w-5 h-5"/>
          </NavLink>
          
          <Button onClick={handleLogout} variant="outline" size="sm" className="!border-slate-700 !text-slate-300 hover:!bg-slate-800 hover:!text-white !px-3">
             <ArrowLeftOnRectangleIcon className="w-4 h-4" />
          </Button>
        </>
      );
    }
    
    // Logged out
    return (
      <>
        <Link to="/premium" className={`${linkClass} !text-amber-400`}>
           <SparklesIcon className="w-4 h-4"/> Premium
        </Link>
        <Link to="/login" className={linkClass}>
          Login
        </Link>
        <Link to="/signup">
          <Button variant='primary' size="sm" className="!bg-white !text-slate-900 hover:!bg-slate-200 !font-bold shadow-lg shadow-white/10">Get Started</Button>
        </Link>
      </>
    );
  };

  return (
    <header className={headerClasses}>
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {renderLogo()}
        <div className="flex items-center space-x-1 md:space-x-3">
          {renderNavLinks()}
        </div>
      </nav>
    </header>
  );
};

export default Header;
