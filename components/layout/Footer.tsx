
import React from 'react';
import { Link } from 'https://esm.sh/react-router-dom';
import { HeartIcon } from '../icons/HeartIcon';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/10 backdrop-blur-sm mt-12 border-t border-slate-300/50 text-slate-700">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
                 <p className="font-bold">StuBro AI</p>
                 <p className="text-sm text-slate-600 mt-1">Your personal AI-powered study buddy.</p>
            </div>
             <div>
                 <p className="font-bold">Links</p>
                 <ul className="mt-2 space-y-1 text-sm">
                     <li><Link to="/about" className="text-slate-600 hover:text-slate-900">About Us</Link></li>
                     <li><Link to="/privacy-policy" className="text-slate-600 hover:text-slate-900">Privacy Policy</Link></li>
                     <li><Link to="/contact" className="text-slate-600 hover:text-slate-900">Contact</Link></li>
                 </ul>
            </div>
             <div>
                <p className="font-bold">From the Developer</p>
                <p className="text-sm text-slate-600 mt-2 flex items-center justify-center md:justify-start gap-1.5">
                    Developed in India with <HeartIcon className="w-4 h-4 text-red-500" />
                </p>
             </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-300/50 text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} StuBro AI by Garv. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;