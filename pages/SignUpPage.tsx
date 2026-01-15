
import React, { useState } from 'react';
import { Link, useNavigate } from 'https://esm.sh/react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/common/Spinner';

const SignUpPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const REQUIRED_INVITE_CODE = "GARVBRO";
  const isInviteValid = inviteCode.trim().toUpperCase() === REQUIRED_INVITE_CODE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInviteValid) {
        return setError('Invalid Invite Code. Access Denied.');
    }
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (!name.trim()) return setError('Please enter your name');
    
    setError('');
    setLoading(true);
    try {
      await signup(email, password, name);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    if (!isInviteValid) {
        return setError('Unlock with Invite Code "GARVBRO" first to use Google Sign-up.');
    }
    setError('');
    setLoading(true);
    try {
        await loginWithGoogle();
        navigate('/app');
    } catch (err: any) {
        setError(err.message || 'Google Sign-up failed.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card variant="light" className="!p-8 md:!p-10 shadow-2xl border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Enter The Vault</h1>
            <p className="mt-2 text-slate-600">Access is private. Invite only.</p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-lg text-center mb-6 text-xs font-bold uppercase tracking-widest">
                {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">1. Required Invite Key</label>
              <input 
                type="text" 
                value={inviteCode} 
                onChange={(e) => {
                    setInviteCode(e.target.value);
                    if (e.target.value.toUpperCase() === REQUIRED_INVITE_CODE) setError('');
                }} 
                required 
                className={`w-full px-4 py-4 border-2 rounded-2xl outline-none text-slate-900 font-black text-center tracking-[0.5em] transition-all ${isInviteValid ? 'bg-green-50 border-green-400' : 'bg-violet-500/5 border-violet-500/20 focus:border-violet-500'}`} 
                placeholder="GARVBRO"
              />
              {isInviteValid && <p className="text-[9px] text-green-600 font-bold mt-1 uppercase tracking-widest text-center">Key Validated. Neural Link Ready.</p>}
            </div>

            <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">2. Choose Method</label>
                
                <button 
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    className={`w-full h-16 bg-white border-2 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-sm group ${isInviteValid ? 'border-slate-300 hover:border-violet-500 hover:bg-slate-50' : 'border-slate-200 opacity-50 cursor-not-allowed'}`}
                >
                    {loading ? <Spinner colorClass="bg-violet-600" /> : (
                        <>
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
                            </svg>
                            <span className="text-base font-bold text-slate-700">Continue with Google</span>
                        </>
                    )}
                </button>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Or Email</span></div>
                </div>

                <form onSubmit={handleSubmit} className={`space-y-4 transition-opacity ${isInviteValid ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 bg-white/60 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-900 shadow-sm" placeholder="Full Name"/>
                    </div>
                    <div>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-white/60 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-900 shadow-sm" placeholder="Email Address"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-white/60 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-900 shadow-sm" placeholder="Password"/>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 bg-white/60 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-900 shadow-sm" placeholder="Confirm"/>
                    </div>
                    <Button type="submit" className="w-full h-14 !text-sm !font-black uppercase tracking-widest" disabled={loading || !isInviteValid}>
                        {loading ? <Spinner colorClass="bg-white"/> : 'Initialize Profile'}
                    </Button>
                </form>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Member? <Link to="/login" className="font-bold text-violet-600 hover:underline">Log In</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;
