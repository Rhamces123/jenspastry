// ==========================================
// Jen's Pastry Shop - Unified Login Page
// Section 14: Customer Google Login + Staff Email/Password Login
// Automatically redirects to /customer, /cashier, /baker, /admin dashboard
// ==========================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { ROLES, getDashboardPathForRole } from '../constants/roles.js';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  ArrowLeft, 
  Croissant,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function Login() {
  const { login, loginWithGoogle, currentUser, userProfile, isLiveFirebase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (currentUser && userProfile) {
      const redirectPath = location.state?.from?.pathname || getDashboardPathForRole(userProfile.role);
      navigate(redirectPath, { replace: true });
    }
  }, [currentUser, userProfile, navigate, location]);

  const formatAuthError = (err) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please verify your staff credentials and try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please reset your password or wait a moment.';
      case 'auth/popup-closed-by-user':
        return 'Google Sign-In popup was closed before completing.';
      default:
        return err?.message || 'Login failed. Please check your credentials and try again.';
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (loading || googleLoading) return;

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your staff email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const { profile } = await login(email.trim(), password, rememberMe);
      const role = profile?.role || ROLES.CUSTOMER;
      const targetDashboard = getDashboardPathForRole(role);
      navigate(targetDashboard, { replace: true });
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
      const { profile } = await loginWithGoogle();
      const role = profile?.role || ROLES.CUSTOMER;
      const targetDashboard = getDashboardPathForRole(role);
      navigate(targetDashboard, { replace: true });
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
          <Croissant size={13} className="text-primary" /> Jen's Pastry Shop
        </span>
      </div>

      <div className="auth-card-modern">
        {/* Brand Header */}
        <div className="auth-header-center">
          <div className="auth-pastry-badge">
            <Croissant size={28} />
          </div>
          <h2 className="auth-title">Welcome to Jen's Pastry Shop 🍰</h2>
          <p className="auth-subtitle">Fresh artisanal breads & sweet delights baked daily</p>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="auth-alert-box auth-alert-error">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. CUSTOMER LOGIN SECTION (Google Sign-In) */}
        <div className="space-y-2 mb-4">
          <button
            type="button"
            className="btn-google-auth w-full"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="font-bold text-sm">Continue with Google</span>
          </button>
          <p className="text-center text-2xs text-muted">
            For Customers • Instant 1-tap pastry ordering & tracking
          </p>
        </div>

        {/* DIVIDER */}
        <div className="auth-divider-row my-4">
          <span className="auth-divider-line"></span>
          <span className="auth-divider-label font-semibold text-2xs uppercase tracking-wider text-muted">
            ──────── OR ────────
          </span>
          <span className="auth-divider-line"></span>
        </div>

        {/* 2. STAFF LOGIN SECTION (Email + Password) */}
        <div className="bg-cream p-3.5 rounded-xl border border-border-light mb-2">
          <div className="flex items-center gap-1.5 mb-2.5">
            <ShieldCheck size={16} className="text-primary" />
            <h3 className="font-bold text-xs text-primary">Staff & Management Portal</h3>
          </div>

          {/* Quick-Fill Staff Credentials Helper */}
          <div className="mb-3 p-2 bg-pink-50/80 border border-pink-200/80 rounded-xl">
            <span className="text-2xs font-extrabold text-primary uppercase tracking-wide block mb-1.5">
              1-Click Staff Fill:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className="text-2xs font-bold px-2 py-1 bg-white border border-pink-300 text-primary-dark rounded-lg hover:bg-pink-100 transition-colors"
                onClick={() => {
                  setEmail('admin@jenspastry.com');
                  setPassword('JP_Admin@2026!');
                  setErrorMessage('');
                }}
              >
                Admin
              </button>
              <button
                type="button"
                className="text-2xs font-bold px-2 py-1 bg-white border border-pink-300 text-primary-dark rounded-lg hover:bg-pink-100 transition-colors"
                onClick={() => {
                  setEmail('cashier@jenspastry.com');
                  setPassword('JP_Cashier@2026!');
                  setErrorMessage('');
                }}
              >
                Cashier
              </button>
              <button
                type="button"
                className="text-2xs font-bold px-2 py-1 bg-white border border-pink-300 text-primary-dark rounded-lg hover:bg-pink-100 transition-colors"
                onClick={() => {
                  setEmail('baker@jenspastry.com');
                  setPassword('JP_Baker@2026!');
                  setErrorMessage('');
                }}
              >
                Baker
              </button>
            </div>
          </div>

          <form onSubmit={handleStaffSubmit} noValidate className="space-y-3">
            {/* Email Field */}
            <div className="auth-form-group">
              <label className="auth-form-label text-xs font-semibold" htmlFor="staff-email">
                Staff Email Address
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Mail size={15} />
                </span>
                <input
                  id="staff-email"
                  type="email"
                  className="auth-input-field text-xs"
                  placeholder="e.g. cashier@jenspastry.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-form-group">
              <div className="flex justify-between items-center">
                <label className="auth-form-label text-xs font-semibold" htmlFor="staff-password">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-2xs text-primary hover:underline font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  <Lock size={15} />
                </span>
                <input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input-field text-xs pr-10"
                  placeholder="Enter staff password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-2xs text-muted">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border-medium text-primary"
                />
                <span>Keep me signed in</span>
              </label>
              <span className="text-2xs text-muted font-medium">Cashier • Baker • Admin</span>
            </div>

            {/* Staff Submit Button */}
            <button
              type="submit"
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 font-bold text-xs shadow-md mt-2"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={15} />
                  <span>Login to Staff Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Mode Notice */}
        {!isLiveFirebase && (
          <div className="mt-3 p-2 bg-pink-50 rounded-lg border border-border-light text-2xs text-muted text-center">
            <span className="font-semibold text-primary">Demo Accounts Available:</span> cashier@jenspastry.com, baker@jenspastry.com, admin@jenspastry.com
          </div>
        )}
      </div>
    </div>
  );
}
