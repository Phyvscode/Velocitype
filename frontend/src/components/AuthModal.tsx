import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Props {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
}

export default function AuthModal({ isOpen, initialMode = 'signup', onClose }: Props) {
  const { login, signup } = useAuth();
  type Mode = 'login' | 'signup' | 'forgot-password' | 'verify-otp' | 'reset-password';
  const [mode, setMode] = useState<Mode>(initialMode);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaValue(result);
  };

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setSuccessMsg('');
      setShowPassword(false);
      if (initialMode === 'login' || initialMode === 'signup') {
        generateCaptcha();
      }
    }
  }, [isOpen, initialMode]);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setCaptchaInput('');
    if (newMode === 'forgot-password') {
      generateCaptcha();
    }
  };

  useEffect(() => {
    if (mode === 'forgot-password' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 400, 56);
        
        ctx.font = '26px "Comic Sans MS", cursive, sans-serif';
        ctx.textBaseline = 'middle';
        
        const totalWidth = captchaValue.length * 40;
        const startX = (400 - totalWidth) / 2 + 10;
        
        for (let i = 0; i < captchaValue.length; i++) {
          const x = startX + i * 40;
          const y = 28 + (Math.random() - 0.5) * 8;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((Math.random() - 0.5) * 0.4);
          ctx.fillStyle = '#334155'; // dark gray
          ctx.fillText(captchaValue[i], 0, 0);
          ctx.restore();
        }
      }
    }
  }, [mode, captchaValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'signup') {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        await signup(username, email, password);
        onClose();
      } else if (mode === 'forgot-password') {
        if (captchaInput !== captchaValue) {
          setError('Incorrect CAPTCHA');
          generateCaptcha();
          setCaptchaInput('');
          setLoading(false);
          return;
        }
        await api.forgotPassword(email);
        setSuccessMsg('OTP sent to your email (check terminal if testing)');
        setMode('verify-otp');
      } else if (mode === 'verify-otp') {
        const res = await api.verifyOTP(email, otp);
        setResetToken(res.resetToken);
        setSuccessMsg('OTP verified! Enter your new password.');
        setMode('reset-password');
      } else if (mode === 'reset-password') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await api.resetPassword(resetToken, password);
        setSuccessMsg('Password reset successfully! You can now log in.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      if (mode === 'forgot-password') generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#161922] border border-slate-700/60 p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-slate-200 transition-colors p-2 text-xl font-bold exclude-theme"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100">
            {mode === 'signup' ? 'Sign Up for Velocitype' : 
             mode === 'login' ? 'Welcome Back' : 
             mode === 'forgot-password' ? 'Reset Password' :
             mode === 'verify-otp' ? 'Enter OTP' : 'New Password'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'signup' && 'Create your account to save your stats.'}
            {mode === 'login' && 'Sign in to access your typing history.'}
            {mode === 'forgot-password' && 'Enter your email to receive a recovery code.'}
            {mode === 'verify-otp' && 'Check your email for the 6-digit code.'}
            {mode === 'reset-password' && 'Choose a strong new password.'}
          </p>
        </div>

        {(mode === 'login' || mode === 'signup') && (
          <div className="flex bg-slate-900/60 p-1 mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="speedtyper99"
                autoComplete="off"
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/60 focus:border-amber-400 focus:outline-none text-slate-100 text-sm"
              />
            </div>
          )}

          {(mode === 'signup' || mode === 'login' || mode === 'forgot-password' || mode === 'verify-otp') && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                disabled={mode === 'verify-otp'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="off"
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/60 focus:border-amber-400 focus:outline-none text-slate-100 text-sm disabled:opacity-50"
              />
            </div>
          )}

          {mode === 'forgot-password' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Security Check</label>
              
              <div className="w-full h-14 bg-white border border-dashed border-slate-400 flex items-center justify-center mb-0.5 overflow-hidden rounded-t-sm">
                <canvas ref={canvasRef} width={400} height={56}></canvas>
              </div>

              <div className="flex">
                <input
                  type="text"
                  required
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Enter captcha text"
                  autoComplete="off"
                  className="w-full px-4 py-2.5 bg-white border border-slate-400 focus:border-slate-500 focus:outline-none text-slate-800 text-sm rounded-bl-sm"
                />
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="bg-slate-500 hover:bg-slate-600 border border-l-0 border-slate-500 text-white px-4 flex items-center justify-center transition-colors rounded-br-sm"
                  title="Refresh CAPTCHA"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                </button>
              </div>
            </div>
          )}

          {mode === 'verify-otp' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">6-Digit Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/60 focus:border-amber-400 focus:outline-none text-slate-100 text-sm tracking-widest text-center text-lg"
              />
            </div>
          )}

          {(mode === 'signup' || mode === 'login' || mode === 'reset-password') && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {mode === 'reset-password' ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pr-16 px-4 py-2.5 bg-slate-900/80 border border-slate-700/60 focus:border-amber-400 focus:outline-none text-slate-100 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 text-xs"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          {mode === 'reset-password' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pr-16 px-4 py-2.5 bg-slate-900/80 border border-slate-700/60 focus:border-amber-400 focus:outline-none text-slate-100 text-sm"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 text-base"
          >
            {loading ? "Loading..." : 
             mode === 'signup' ? "Create Account" : 
             mode === 'login' ? "Sign In" : 
             mode === 'forgot-password' ? "Send Recovery Email" : 
             mode === 'verify-otp' ? "Verify Code" : "Update Password"}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => switchMode('forgot-password')}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        )}

        {(mode === 'forgot-password' || mode === 'verify-otp' || mode === 'reset-password') && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        )}

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
