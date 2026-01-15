import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'https://esm.sh/react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { 
    ArrowLeftOnRectangleIcon, AcademicCapIcon, UserCircleIcon, 
    ChevronDownIcon, SparklesIcon, BrainCircuitIcon, CalendarIcon, 
    RocketLaunchIcon, DocumentDuplicateIcon, ChatBubbleLeftRightIcon, 
    GavelIcon, QuestIcon, BeakerIcon 
} from '../icons';

const Header: React.FC = () => {
  const { currentUser, logout, loading, tokens } = useAuth();
  const navigate = useNavigate();
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
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const linkClass = "text-slate-400 hover:text-white transition-all duration-300 px-3 py-1 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase flex items-center gap-2";
  const activeLinkClass = "text-violet-400 !bg-violet-500/10 border border-violet-500/20";

  return (
    <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'py-3' : 'py-6'}`}>
      <nav className={`container mx-auto px-6 flex justify-between items-center transition-all duration-500 ${scrolled ? 'max-w-[1200px] glass-card !rounded-full !py-3' : 'max-w-full bg-transparent'}`}>
        {/* Majestic Logo */}
        <NavLink to="/" className="flex items-center gap-4 group">
            <div className="relative">
                 <div className="absolute inset-0 bg-violet-600 rounded-2xl blur group-hover:blur-xl opacity-40 transition-all"></div>
                 <div className="relative bg-gradient-to-br from-violet-600 to-indigo-700 p-2.5 rounded-2xl shadow-2xl border border-white/20">
                    <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
            </div>
            <div className="hidden sm:block">
                <span className="text-xl font-black text-white tracking-tighter leading-none block">STUBRO <span className="text-violet-400">AI</span></span>
                <span className="text-[9px] font-bold text-slate-500 tracking-[0.4em] uppercase block mt-0.5">NEURAL ENGINE</span>
            </div>
        </NavLink>

        {/* Dynamic Navigation */}
        <div className="flex items-center gap-2 md:gap-6">
          {currentUser ? (
            <>
              <NavLink to="/app" className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>
                HQ
              </NavLink>
              
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`${linkClass} ${dropdownOpen ? 'text-white' : ''}`}>
                  SIMS <ChevronDownIcon className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-4 w-64 rounded-3xl glass-card border border-white/10 p-2 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid gap-1">
                       <p className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 mb-2">Simulation Modules</p>
                      <SIMLink to="/digital-lab" icon={<BeakerIcon/>} label="Digital Lab 3D" color="text-blue-400" onClick={()=>setDropdownOpen(false)} />
                      <SIMLink to="/chapter-conquest" icon={<QuestIcon/>} label="Chapter Odyssey" color="text-amber-400" onClick={()=>setDropdownOpen(false)} />
                      <SIMLink to="/live-debate" icon={<GavelIcon/>} label="Arena of Logic" color="text-orange-400" onClick={()=>setDropdownOpen(false)} />
                      <SIMLink to="/mind-map" icon={<BrainCircuitIcon/>} label="Neural Map" color="text-violet-400" onClick={()=>setDropdownOpen(false)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-full border border-white/5 font-mono-tech text-xs">
                 <SparklesIcon className="w-3 h-3 text-amber-400"/>
                 <span className="text-slate-400 uppercase tracking-widest">NT:</span>
                 <span className="text-white font-black">{tokens ?? '...'}</span>
              </div>
              
              <NavLink to="/profile" className={({ isActive }) => `${linkClass} p-2 !bg-white/5 !rounded-full ${isActive ? 'text-white ring-2 ring-violet-500/50' : ''}`}>
                  <UserCircleIcon className="w-6 h-6"/>
              </NavLink>
              
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                 <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/premium" className={`${linkClass} !text-amber-400`}>Premium</Link>
              <Link to="/login" className={linkClass}>Login</Link>
              <Link to="/signup">
                <Button size="sm" className="!bg-white !text-slate-950 !rounded-full !px-6 !font-black !text-[10px] tracking-widest uppercase">Launch</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

const SIMLink = ({ to, icon, label, color, onClick }: any) => (
  <Link to={to} onClick={onClick} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 transition-all group">
    <div className={`p-2 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform ${color}`}>{icon}</div>
    <span className="text-xs font-bold text-slate-300 group-hover:text-white uppercase tracking-wider">{label}</span>
  </Link>
);

export default Header;