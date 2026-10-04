// ==========================================
// Jen's Pastry Shop - Role-Based Route Guard (RBAC)
// Restricts dashboard access strictly by user role.
// Unauthorized role attempts are blocked and redirected to their own dashboard.
// ==========================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { ROLES, getDashboardPathForRole } from '../constants/roles.js';

export default function RoleRoute({ allowedRoles = [], children }) {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[350px]">
        <div className="w-10 h-10 border-4 border-primary-light border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-muted">Checking authorization...</p>
      </div>
    );
  }

  // If not logged in at all -> redirect to /login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Derive user role (defaulting to customer if not yet assigned)
  const currentRole = userProfile?.role || ROLES.CUSTOMER;

  // If the user's role is not in the allowed list -> Block and redirect to their correct dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    const correctDashboard = getDashboardPathForRole(currentRole);
    console.warn(`[RBAC Block] User with role '${currentRole}' attempted to access '${location.pathname}'. Redirecting to '${correctDashboard}'.`);
    return <Navigate to={correctDashboard} replace />;
  }

  return children;
}
