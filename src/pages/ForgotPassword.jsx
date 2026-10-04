// ==========================================
// BAKEOLOGY - Forgot Password Page
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
      {/* Back to Login Link */}
      <div className="auth-back-link mb-3">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </div>

      <div className="auth-card mobile-card">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="auth-icon-badge mx-auto mb-2.5">
            <KeyRound size={22} />
          </div>
          <h2 className="text-xl font-bold font-serif text-primary">Reset Password</h2>
          <p className="text-xs text-muted mt-1">
            Enter your registered email address and we'll send you instructions to reset your password.
          </p>

          {!isLiveFirebase && (
            <div className="mt-2.5 p-2 bg-pink-50 border border-primary-soft rounded-lg text-2xs text-primary font-medium">
              💡 Demo Mode active (configure Firebase credentials in <code>.env</code> for live email dispatch).
            </div>
          )}
        </div>

        {/* Success Confirmation State */}
        {isSubmitted ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center space-y-3">
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
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 font-bold text-xs shadow-sm mt-3"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* Error Notification */}
            {errorMessage && (
              <div className="auth-error-box flex items-start gap-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Reset Request Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label" htmlFor="reset-email">
                  Registered Email Address
                </label>
                <div className="relative">
                  <span className="auth-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    className="input-field auth-input"
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
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 font-bold text-sm shadow-md"
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

        {/* Back Link */}
        <div className="text-center mt-5 text-xs text-muted">
          Remember your password?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
