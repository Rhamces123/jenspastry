// ==========================================
// BAKEOLOGY - Customer Login Page
// Modern pastry-themed login with email/password and Google authentication
// ==========================================

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { login, loginWithGoogle, isLiveFirebase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Destination after successful login
  const from = location.state?.from?.pathname || '/';

  const formatAuthError = (err) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please verify your credentials and try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please reset your password or wait a moment.';
      case 'auth/popup-closed-by-user':
        return 'Google Sign-In popup was closed before completing.';
      default:
        return err?.message || 'Login failed. Please check your credentials and try again.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || googleLoading) return;

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await login(email.trim(), password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;

    setGoogleLoading(true);
    setErrorMessage('');

    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Back to Bakery Storefront */}
      <div className="auth-back-link mb-3">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Bakery Store
        </Link>
      </div>

      <div className="auth-card mobile-card">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="auth-icon-badge mx-auto mb-2.5">
            <LogIn size={22} />
          </div>
          <h2 className="text-xl font-bold font-serif text-primary">Welcome Back!</h2>
          <p className="text-xs text-muted mt-1">Sign in to your BAKEOLOGY customer account</p>
          
          {!isLiveFirebase && (
            <div className="mt-2.5 p-2 bg-pink-50 border border-primary-soft rounded-lg text-2xs text-primary font-medium">
              💡 Demo Mode active (configure Firebase credentials in <code>.env</code> for live sync).
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="auth-error-box flex items-start gap-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email Field */}
          <div>
            <label className="input-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="relative">
              <span className="auth-input-icon">
                <Mail size={16} />
              </span>
              <input
                id="login-email"
                type="email"
                className="input-field auth-input"
                placeholder="baker@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading || googleLoading}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="input-label mb-0" htmlFor="login-password">
                Password
              </label>
              <Link 
                to="/forgot-password" 
                className="text-2xs font-semibold text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="auth-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field auth-input pr-10"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading || googleLoading}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted">
              <input
                type="checkbox"
                className="rounded text-primary focus:ring-primary accent-primary"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading || googleLoading}
              />
              <span>Remember me on this device</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 font-bold text-sm shadow-md mt-2"
            disabled={loading || googleLoading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider my-4">
          <span>or continue with</span>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2.5 text-xs font-semibold"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>Sign In with Google</span>
        </button>

        {/* Link to Signup */}
        <div className="text-center mt-5 text-xs text-muted">
          Don't have an account yet?{' '}
          <Link to="/signup" className="text-primary font-bold hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
