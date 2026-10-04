// ==========================================
// BAKEOLOGY - Protected Route Guard
// Redirects unauthenticated users to /login preserving target location
// ==========================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

import { ROLES, getDashboardPathForRole, resolveRoleForUser } from '../constants/roles.js';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
        <div className="w-10 h-10 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-muted">Checking authorization...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentRole = resolveRoleForUser(
    currentUser?.email || userProfile?.email,
    userProfile?.fullName || currentUser?.displayName,
    userProfile?.role
  );

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    const correctDashboard = getDashboardPathForRole(currentRole);
    return <Navigate to={correctDashboard} replace />;
  }

  return children;
}
