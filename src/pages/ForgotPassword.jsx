// ==========================================
// BAKEOLOGY - Forgot Password Page (100x Modern Upgrade)
// Sends password reset email instructions via Firebase Authentication
// ==========================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { Mail, KeyRound, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const { resetPassword, isLiveFirebase } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatAuthError = (err) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account was found with this email address.';
      default:
        return err?.message || 'Failed to send password reset email. Please try again later.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await resetPassword(trimmedEmail);
      setIsSubmitted(true);
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
        <Link to="/login" className="auth-back-btn">
          <ArrowLeft size={14} />
          <span>Back to Sign In</span>
        </Link>
      </div>

      <div className="auth-card-modern">
        {/* Brand Header */}
        <div className="auth-header-center">
          <div className="auth-pastry-badge">
            <KeyRound size={24} />
          </div>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {/* Success Confirmation State */}
        {isSubmitted ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-green-900">Reset Email Dispatched!</h4>
              <p className="text-xs text-green-700 mt-1">
                We've sent a password reset link to <strong>{email}</strong>. Check your inbox and spam folder.
              </p>
            </div>
            <Link
              to="/login"
              className="btn-auth-primary"
              style={{ textDecoration: 'none' }}
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="auth-alert-box auth-alert-error">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Reset Request Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="auth-form-group">
                <div className="auth-label-row">
                  <label className="auth-form-label" htmlFor="reset-email">
                    <span>Registered Email Address</span>
                  </label>
                </div>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    className="auth-input-field"
                    placeholder="baker@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-auth-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending email...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          </>
        )}

        {/* Footer Link */}
        <div className="auth-card-footer">
          <span>Remember your password?</span>
          <Link to="/login" className="auth-link-bold">
            Sign In here
          </Link>
        </div>

        {/* Subtle Demo Mode Badge */}
        {!isLiveFirebase && (
          <div className="auth-demo-badge">
            <span>💡 Demo Mode active (instant local test)</span>
          </div>
        )}
      </div>
    </div>
  );
}
