

import React, { useState } from 'react';
import { Link, useNavigate } from 'https://esm.sh/react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/common/Spinner';

const SignUpPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
     if (!name.trim()) {
      return setError('Please enter your name');
    }
    setError('');
    setLoading(true);
    try {
      await signup(email, password, name);
      navigate('/app');
    } catch (err: any) {
      if (err.message.includes("Firebase is not configured")) {
        setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Failed to create an account. Please try again.');
      }
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card variant="light" className="!p-8 md:!p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Create Your Account</h1>
            <p className="mt-2 text-slate-600">Join StuBro AI to get personalized help.</p>
          </div>
          {error && <p className="bg-red-500/20 text-red-600 p-3 rounded-md text-center mb-4 text-sm font-semibold">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white/60 border border-slate-400 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white/60 border border-slate-400 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white/60 border border-slate-400 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 bg-white/60 border border-slate-400 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <div className="text-center pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner colorClass="bg-white"/> : 'Sign Up'}
              </Button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-violet-600 hover:text-violet-500">
              Log In
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;