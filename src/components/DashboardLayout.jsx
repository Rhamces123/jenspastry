// ==========================================
// Jen's Pastry Shop - Unified Responsive Dashboard Layout
// Supports Customer, Cashier, Baker, and Admin with role-specific navigation
// Responsive sidebar, mobile drawer, role badge, and user controls
// ==========================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { ROLE_LABELS, ROLES, resolveRoleForUser } from '../constants/roles.js';
import { 
  Croissant, 
  Menu, 
  X, 
  LogOut, 
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function DashboardLayout({
  role = ROLES.CUSTOMER,
  title,
  subtitle,
  navigationItems = [],
  activeItem,
  onSelectItem,
  headerActions,
  children
}) {
  const { currentUser, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  // Determine user's authoritative profile role, falling back to page role prop
  const effectiveRole = resolveRoleForUser(
    userProfile?.email || currentUser?.email,
    userProfile?.fullName || currentUser?.displayName,
    userProfile?.role || role
  );
  const displayName = userProfile?.fullName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const roleLabel = ROLE_LABELS[effectiveRole] || ROLE_LABELS[role] || effectiveRole;

  const getRolePillClass = (r) => {
    switch (r) {
      case ROLES.ADMIN:
        return 'role-admin';
      case ROLES.CASHIER:
        return 'role-cashier';
      case ROLES.BAKER:
        return 'role-baker';
      default:
        return 'role-customer';
    }
  };

  return (
    <div className="dashboard-shell">
      {/* Top Navbar */}
      <header className="dashboard-topbar">
        <div className="dashboard-brand">
          <button
            type="button"
            className="header-btn"
            style={{ display: 'none', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="dashboard-brand-logo">
              <Croissant size={20} />
            </div>
            <div>
              <span className="dashboard-brand-title">BAKEOLOGY</span>
              <span className="dashboard-brand-subtitle" style={{ display: 'block' }}>Jen's Pastry Shop</span>
            </div>
          </Link>
        </div>

        {/* User Profile Badge & Logout */}
        <div className="dashboard-topbar-actions">
          {/* If an Admin is previewing or viewing customer/staff dashboard, provide instant switch back */}
          {effectiveRole === ROLES.ADMIN && role !== ROLES.ADMIN && (
            <Link
              to="/admin/dashboard"
              className="dashboard-admin-portal-btn"
              style={{
                textDecoration: 'none',
                padding: '6px 12px',
                background: '#eab308',
                color: '#1a1a1a',
                fontWeight: 700,
                borderRadius: '8px',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
              title="Return to Store Owner / Admin Dashboard"
            >
              <span>👑 Admin Dashboard</span>
            </Link>
          )}

          <div className="dashboard-user-badge">
            <div className="dashboard-user-avatar">
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="dashboard-user-text">
              <span className="dashboard-user-name">{displayName}</span>
              <span className="dashboard-user-role">{roleLabel}</span>
            </div>
          </div>

          <span className={`dashboard-role-pill ${getRolePillClass(effectiveRole)}`}>
            {effectiveRole}
          </span>

          <button
            type="button"
            className="dashboard-logout-btn"
            onClick={handleLogout}
            title="Log Out of Bakery"
            aria-label="Log Out"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Body (Sidebar + Content Area) */}
      <div className="dashboard-container">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="mobile-drawer-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 35
            }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
          <div>
            <div className="dashboard-sidebar-header">
              <span>{ROLE_LABELS[role] || roleLabel} Menu</span>
              <Sparkles size={12} style={{ color: '#BE185D' }} />
            </div>

            <nav className="dashboard-nav-list">
              {navigationItems.map((item) => {
                const Icon = item.icon || ChevronRight;
                const isActive = activeItem === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`dashboard-nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectItem(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <div className="dashboard-nav-btn-content">
                      <Icon size={17} style={{ color: isActive ? '#FFFFFF' : '#9D174D' }} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge !== null && (
                      <span className="dashboard-nav-badge">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer User Info */}
          <div className="dashboard-sidebar-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="dashboard-user-avatar" style={{ width: '32px', height: '32px' }}>
                {displayName[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ minWidth: 0, flex: 1, lineHeight: '1.2' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#1F242E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName}
                </p>
                <p style={{ fontSize: '10px', color: '#717A88', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser?.email}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Workspace */}
        <main className="dashboard-content-area">
          {/* Header Sub-bar */}
          {(title || headerActions) && (
            <div className="dashboard-content-header">
              <div>
                <h1 className="dashboard-header-title">{title}</h1>
                {subtitle && <p className="dashboard-header-subtitle">{subtitle}</p>}
              </div>
              {headerActions && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {headerActions}
                </div>
              )}
            </div>
          )}

          {/* Scrollable Children */}
          <div className="dashboard-content-body">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
