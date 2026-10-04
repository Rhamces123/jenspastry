// ==========================================
// BAKEOLOGY - Customer Sign Up Page (100x Modern Upgrade)
// Artisanal bakery themed registration with live validation and Firestore sync
// ==========================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  AlertCircle, 
  ArrowLeft, 
  Sparkles, 
  LogIn
} from 'lucide-react';

export default function Signup() {
  const { signup, isLiveFirebase } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isPasswordLongEnough = password.length >= 6;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  const formatAuthError = (err) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please log in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/Password sign up is not enabled in Firebase Console.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      default:
        return err?.message || 'Registration failed. Please check your information and try again.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    // 1. Required field validation
    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. baker@example.com).');
      return;
    }

    // 3. Password length validation
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    // 4. Confirm password match validation
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    // 5. Terms agreement checkbox
    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service & Privacy Policy to register.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await signup(trimmedEmail, password, trimmedName);
      navigate('/', { replace: true, state: { accountCreated: true } });
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setLoading(false);
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
          <Sparkles size={13} className="text-primary" /> Pastry Club
        </span>
      </div>

      <div className="auth-card-modern">
        {/* iOS-Style Segmented Tab Switcher */}
        <div className="auth-segmented-tabs">
          <Link 
            to="/login" 
            className="auth-tab-pill"
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </Link>
          <button 
            type="button" 
            className="auth-tab-pill active"
            disabled
          >
            <Sparkles size={14} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="auth-header-center">
          <div className="auth-pastry-badge">
            <UserPlus size={24} />
          </div>
          <h2 className="auth-title">Join Bakeology!</h2>
          <p className="auth-subtitle">Create your customer account to save favorites & track orders</p>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="auth-alert-box auth-alert-error">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-form-label" htmlFor="signup-name">
                <span>Full Name</span>
              </label>
            </div>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <User size={16} />
              </span>
              <input
                id="signup-name"
                type="text"
                className="auth-input-field"
                placeholder="e.g. Maria Santos"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-form-label" htmlFor="signup-email">
                <span>Email Address</span>
              </label>
            </div>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Mail size={16} />
              </span>
              <input
                id="signup-email"
                type="email"
                className="auth-input-field"
                placeholder="maria@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-form-label" htmlFor="signup-password">
                <span>Password</span>
              </label>
              {password.length > 0 && (
                <span className={`auth-match-badge ${isPasswordLongEnough ? 'auth-match-success' : 'auth-match-neutral'}`}>
                  {isPasswordLongEnough ? '✓ 6+ chars' : `${password.length}/6 chars`}
                </span>
              )}
            </div>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input-field"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
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

          {/* Confirm Password */}
          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-form-label" htmlFor="signup-confirm-password">
                <span>Confirm Password</span>
              </label>
              {confirmPassword.length > 0 && (
                <span className={`auth-match-badge ${doPasswordsMatch ? 'auth-match-success' : 'auth-match-neutral'}`}>
                  {doPasswordsMatch ? '✓ Passwords match' : 'Must match'}
                </span>
              )}
            </div>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="auth-input-field"
                placeholder="Re-type your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                tabIndex="-1"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Terms & Privacy Policy Checkbox */}
          <label className="auth-checkbox-row items-start">
            <input
              type="checkbox"
              className="auth-checkbox mt-0.5"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={loading}
              required
            />
            <span>
              I agree to the <span className="text-primary font-bold">Terms of Service</span> and{' '}
              <span className="text-primary font-bold">Privacy Policy</span> of Jen's Pastry Shop.
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-auth-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Customer Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="auth-card-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-link-bold">
            Sign In
          </Link>
        </div>

        {/* Subtle Demo Mode Badge (unobtrusive pill) */}
        {!isLiveFirebase && (
          <div className="auth-demo-badge" title="Configure .env for real-time Firebase cloud sync">
            <span>💡 Demo Mode active (instant local sign up)</span>
          </div>
        )}
      </div>
    </div>
  );
}
