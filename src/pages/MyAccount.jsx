// ==========================================
// BAKEOLOGY - Customer Account Page
// Displays user profile, profile editing, password management, and navigation
// ==========================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { formatDateTime } from '../utils/formatters.js';
import { 
  User, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  LogOut, 
  KeyRound, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

export default function MyAccount() {
  const { currentUser, userProfile, updateUserProfile, resetPassword, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(userProfile?.fullName || currentUser?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [resetSent, setResetSent] = useState(false);

  const displayEmail = currentUser?.email || userProfile?.email || 'N/A';
  const creationDate = userProfile?.createdAt || currentUser?.metadata?.creationTime;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (loading) return;

    const trimmed = fullName.trim();
    if (!trimmed) {
      setFeedback({ message: 'Full name cannot be empty.', type: 'error' });
      return;
    }

    setLoading(true);
    setFeedback({ message: '', type: '' });

    try {
      await updateUserProfile({ fullName: trimmed });
      setIsEditing(false);
      setFeedback({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setFeedback({ message: err?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!displayEmail || resetSent) return;
    try {
      await resetPassword(displayEmail);
      setResetSent(true);
      setFeedback({ 
        message: `Password reset instructions sent to ${displayEmail}.`, 
        type: 'success' 
      });
    } catch (err) {
      setFeedback({ 
        message: err?.message || 'Failed to send password reset request.', 
        type: 'error' 
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="account-page-container space-y-4">
      {/* Back to Bakery Storefront */}
      <div className="auth-back-link mb-2">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <ArrowLeft size={16} /> Back to Bakery Store
        </Link>
      </div>

      {/* Account Hero Card */}
      <div className="mobile-card account-hero-card">
        <div className="flex items-center gap-3.5">
          <div className="account-avatar">
            <User size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-serif text-primary">
              {userProfile?.fullName || currentUser?.displayName || 'Customer'}
            </h2>
            <p className="text-xs text-muted flex items-center gap-1">
              <Mail size={13} className="inline" /> {displayEmail}
            </p>
            <span className="badge badge-success text-2xs mt-1.5 inline-flex items-center gap-1">
              <ShieldCheck size={11} /> Verified Customer
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback.message && (
        <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
          feedback.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Profile Details Card */}
      <div className="mobile-card space-y-3.5">
        <div className="flex justify-between items-center border-b border-border-light pb-2">
          <h3 className="font-bold text-sm text-primary">Profile Information</h3>
          {!isEditing ? (
            <button
              type="button"
              className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
              onClick={() => {
                setFullName(userProfile?.fullName || currentUser?.displayName || '');
                setIsEditing(true);
              }}
            >
              <Edit3 size={13} /> Edit
            </button>
          ) : (
            <button
              type="button"
              className="text-xs font-semibold text-muted flex items-center gap-1 hover:underline"
              onClick={() => setIsEditing(false)}
            >
              <X size={14} /> Cancel
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="input-label" htmlFor="edit-name">
                Full Name
              </label>
              <input
                id="edit-name"
                type="text"
                className="input-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-2 flex items-center justify-center gap-2 text-xs font-bold"
              disabled={loading}
            >
              <Save size={14} />
              <span>{loading ? 'Saving Changes...' : 'Save Profile'}</span>
            </button>
          </form>
        ) : (
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-muted">Full Name</span>
              <span className="font-semibold text-primary">
                {userProfile?.fullName || currentUser?.displayName || 'Not Set'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border-light">
              <span className="text-muted">Email Address</span>
              <span className="font-semibold text-primary">{displayEmail}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted flex items-center gap-1">
                <Calendar size={13} /> Member Since
              </span>
              <span className="font-semibold text-primary">
                {creationDate ? formatDateTime(creationDate) : 'Recently'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Card */}
      <div className="mobile-card space-y-2.5">
        <h3 className="font-bold text-sm text-primary mb-2">Account Actions</h3>

        {/* View My Orders Button */}
        <Link
          to="/my-orders"
          className="btn-secondary w-full py-2.5 flex items-center justify-between text-xs font-semibold px-3.5"
        >
          <div className="flex items-center gap-2 text-primary">
            <ShoppingBag size={16} />
            <span>My Orders & Receipts</span>
          </div>
          <span className="text-muted">→</span>
        </Link>

        {/* Reset / Change Password Button */}
        <button
          type="button"
          className="btn-secondary w-full py-2.5 flex items-center justify-between text-xs font-semibold px-3.5 text-left"
          onClick={handlePasswordReset}
          disabled={resetSent}
        >
          <div className="flex items-center gap-2 text-primary">
            <KeyRound size={16} />
            <span>{resetSent ? 'Reset Email Sent' : 'Change / Reset Password'}</span>
          </div>
          <span className="text-2xs text-muted font-normal">via Email</span>
        </button>

        {/* Sign Out Button */}
        <button
          type="button"
          className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-red-600 hover:bg-red-50 border-red-200 mt-2"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
