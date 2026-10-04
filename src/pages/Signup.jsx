// ==========================================
// BAKEOLOGY - Customer Sign Up Page
// Customer account registration with validation and Firestore profile creation
// ==========================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Signup() {
  const { signup, isLiveFirebase } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
            <UserPlus size={22} />
          </div>
          <h2 className="text-xl font-bold font-serif text-primary">Create Your Account</h2>
          <p className="text-xs text-muted mt-1">Join BAKEOLOGY for express orders and history</p>

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

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="input-label" htmlFor="signup-name">
              Full Name
            </label>
            <div className="relative">
              <span className="auth-input-icon">
                <User size={16} />
              </span>
              <input
                id="signup-name"
                type="text"
                className="input-field auth-input"
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
          <div>
            <label className="input-label" htmlFor="signup-email">
              Email Address
            </label>
            <div className="relative">
              <span className="auth-input-icon">
                <Mail size={16} />
              </span>
              <input
                id="signup-email"
                type="email"
                className="input-field auth-input"
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
          <div>
            <label className="input-label" htmlFor="signup-password">
              Password <span className="text-2xs font-normal text-muted">(min. 6 characters)</span>
            </label>
            <div className="relative">
              <span className="auth-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field auth-input pr-10"
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
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="input-label" htmlFor="signup-confirm-password">
              Confirm Password
            </label>
            <div className="relative">
              <span className="auth-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field auth-input pr-10"
                placeholder="Re-type your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Terms & Privacy Policy Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-muted">
              <input
                type="checkbox"
                className="mt-0.5 rounded text-primary focus:ring-primary accent-primary"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={loading}
                required
              />
              <span>
                I agree to the <span className="text-primary font-semibold">Terms of Service</span> and{' '}
                <span className="text-primary font-semibold">Privacy Policy</span> of Jen's Pastry Shop.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 font-bold text-sm shadow-md mt-2"
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
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div className="text-center mt-5 text-xs text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
