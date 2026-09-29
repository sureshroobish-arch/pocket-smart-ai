import React, { useState } from 'react';
import { PageView } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthPagesProps {
  mode: 'login' | 'register';
  onNavigate: (page: PageView) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ mode, onNavigate }) => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsDemoUser,
    loading,
    error,
    clearError,
  } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const switchMode = (target: 'login' | 'register') => {
    clearError();
    setLocalError(null);
    onNavigate(target);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === 'register') {
      if (fullName.trim().length < 2) {
        setLocalError('Please enter your full name (at least 2 characters).');
        return;
      }
      if (!emailRegex.test(email.trim())) {
        setLocalError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match. Please check Confirm Password.');
        return;
      }

      const ok = await registerWithEmail(fullName.trim(), email.trim(), password, confirmPassword);
      if (ok) {
        onNavigate('dashboard');
      }
    } else {
      if (!emailRegex.test(email.trim())) {
        setLocalError('Please enter a valid email address.');
        return;
      }
      if (!password) {
        setLocalError('Please enter your password.');
        return;
      }

      const ok = await loginWithEmail(email.trim(), password);
      if (ok) {
        onNavigate('dashboard');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setLocalError(null);
    const ok = await loginWithGoogle();
    if (ok) {
      onNavigate('dashboard');
    }
  };

  const handleDemoSignIn = async () => {
    clearError();
    setLocalError(null);
    const ok = await loginAsDemoUser();
    if (ok) {
      onNavigate('dashboard');
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div>
          <p className="text-xs font-semibold text-blue-700">PocketSmart AI Account</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Login to your account' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {mode === 'login'
              ? 'Access your smart budget dashboard and saved recommendation history.'
              : 'Plan smarter, spend better, and keep every recommendation within your budget.'}
          </p>
        </div>

        {activeError && (
          <div
            role="alert"
            className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800"
          >
            {activeError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-fullname" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                id="auth-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aarav Sharma"
                required
                autoComplete="name"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@example.com"
              required
              autoComplete="email"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="auth-confirm-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading
                ? mode === 'login'
                  ? 'Logging in...'
                  : 'Creating Account...'
                : mode === 'login'
                ? 'Login'
                : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="w-full py-2.5 px-4 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {mode === 'login' ? 'Create Account' : 'Login'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200 space-y-2.5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
          >
            Quick Demo Login (demo@example.com · Preloaded ₹50k, ₹30k &amp; ₹1L Plans)
          </button>
        </div>
      </div>
    </div>
  );
};
