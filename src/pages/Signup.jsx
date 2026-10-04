// ==========================================
// Jen's Pastry Shop - Customer Registration & Info Page
// Customers register instantly via "Continue with Google"
// Staff accounts are securely provisioned by Administration
// ==========================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { ROLES, getDashboardPathForRole } from '../constants/roles.js';
import { 
  ArrowLeft, 
  Croissant, 
  Sparkles, 
  ShieldCheck, 
  LogIn, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function Signup() {
  const { loginWithGoogle, isLiveFirebase } = useAuth();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignup = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setErrorMessage('');

    try {
      const { profile } = await loginWithGoogle();
      const role = profile?.role || ROLES.CUSTOMER;
      navigate(getDashboardPathForRole(role), { replace: true });
    } catch (err) {
      setErrorMessage(err?.message || 'Google registration was interrupted. Please try again.');
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
            <Sparkles size={28} />
          </div>
          <h2 className="auth-title">Join Jen's Pastry Club</h2>
          <p className="auth-subtitle">Fast, secure customer access with Google</p>
        </div>

        {errorMessage && (
          <div className="auth-alert-box auth-alert-error mb-4">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Benefits Card */}
        <div className="bg-cream p-4 rounded-xl border border-border-light space-y-2 mb-4">
          <h3 className="font-bold text-xs text-primary mb-1">Customer Perks:</h3>
          <div className="flex items-center gap-2 text-xs text-muted">
            <CheckCircle2 size={14} className="text-success shrink-0" />
            <span>Instant 1-tap checkout for fresh pastries</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <CheckCircle2 size={14} className="text-success shrink-0" />
            <span>Real-time order status and preparation tracking</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <CheckCircle2 size={14} className="text-success shrink-0" />
            <span>No passwords to remember • Secured by Google</span>
          </div>
        </div>

        {/* Google Registration Trigger */}
        <div className="space-y-2 mb-4">
          <button
            type="button"
            className="btn-google-auth w-full py-3"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
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
            <span className="font-bold text-sm">Join with Google</span>
          </button>
        </div>

        {/* Staff Notice */}
        <div className="p-3 bg-cream-pure rounded-xl border border-border-light text-center space-y-1 text-2xs text-muted mb-4">
          <div className="flex items-center justify-center gap-1 font-semibold text-primary">
            <ShieldCheck size={14} />
            <span>Are you a Bakery Staff Member?</span>
          </div>
          <p>
            Cashier, Baker, and Admin accounts are securely provisioned by store administration.
          </p>
          <Link to="/login" className="inline-flex items-center gap-1 text-primary font-bold hover:underline pt-1">
            <LogIn size={12} />
            <span>Go to Staff Login</span>
          </Link>
        </div>

        <div className="text-center text-xs text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
