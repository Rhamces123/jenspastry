// ==========================================
// BAKEOLOGY - Customer Login Page (100x Modern Upgrade)
// Artisanal bakery themed login with email/password and Google authentication
// ==========================================

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  ArrowLeft, 
  Sparkles,
  Croissant
} from 'lucide-react';

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
      setErrorMessage('Please enter both your email and password.');
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
      {/* Top Bar Navigation */}
      <div className="auth-top-bar">
        <Link to="/" className="auth-back-btn">
          <ArrowLeft size={14} />
          <span>Back to Store</span>
        </Link>
        <span className="text-2xs font-semibold text-muted flex items-center gap-1">
          <Croissant size={13} className="text-primary" /> Jen's Pastry
        </span>
      </div>

      <div className="auth-card-modern">
        {/* iOS-Style Segmented Tab Switcher */}
        <div className="auth-segmented-tabs">
          <button 
            type="button" 
            className="auth-tab-pill active"
            disabled
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
          <Link 
            to="/signup" 
            className="auth-tab-pill"
          >
            <Sparkles size={14} />
            <span>Create Account</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="auth-header-center">
          <div className="auth-pastry-badge">
            <Croissant size={24} />
          </div>
          <h2 className="auth-title">Welcome Back!</h2>
          <p className="auth-subtitle">Sign in to enjoy express orders & fresh pastry treats</p>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="auth-alert-box auth-alert-error">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-form-label" htmlFor="login-email">
                <span>Email Address</span>
              </label>
            </div>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Mail size={16} />
              </span>
              <input
                id="login-email"
                type="email"
                className="auth-input-field"
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
          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-form-label" htmlFor="login-password">
                <span>Password</span>
              </label>
              <Link 
                to="/forgot-password" 
                className="auth-forgot-link"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input-field"
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
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <label className="auth-checkbox-row">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading || googleLoading}
            />
            <span>Remember me on this device</span>
          </label>

          {/* Primary Sign In Button */}
          <button
            type="submit"
            className="btn-auth-primary"
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
                <span>Sign In to Bakery</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider-wrap">
          <div className="auth-divider-line"></div>
          <span className="auth-divider-text">or continue with</span>
          <div className="auth-divider-line"></div>
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          className="btn-auth-google"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>Sign In with Google</span>
        </button>

        {/* Footer Switcher */}
        <div className="auth-card-footer">
          <span>Don't have an account yet?</span>
          <Link to="/signup" className="auth-link-bold">
            Create Account
          </Link>
        </div>

        {/* Subtle Demo Mode Badge (unobtrusive pill) */}
        {!isLiveFirebase && (
          <div className="auth-demo-badge" title="Configure .env for real-time Firebase cloud sync">
            <span>💡 Demo Mode active (instant local sign in)</span>
          </div>
        )}
      </div>
    </div>
  );
}
