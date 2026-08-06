import React, { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

interface Props {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
}

export default function AuthModal({ isOpen, initialMode = 'signup', onClose }: Props) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        await signup(username, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#161922] border border-slate-700/60 p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1"
        >
          
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
            
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            {mode === 'signup' ? 'Sign Up for Velocitype' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'signup'
              ? 'Create your account to save your WPM stats and word library.'
              : 'Sign in to access your typing history and vocabulary.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-900/60 p-1 mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2 text-sm font-semibold transition-all ${
              mode === 'signup'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-sm font-semibold transition-all ${
              mode === 'login'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="speedtyper99"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/60 focus:border-amber-400 focus:outline-none text-slate-100 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/60 focus:border-amber-400 focus:outline-none text-slate-100 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700/60 focus:border-amber-400 focus:outline-none text-slate-100 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 text-base"
          >
            {loading ? (
              "Loading..."
            ) : mode === 'signup' ? (
              <>
                 Create Account
              </>
            ) : (
              <>
                 Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition-colors font-medium"
          >
            Continue as Guest 
          </button>
        </div>
      </div>
    </div>
  );
}