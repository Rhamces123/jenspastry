// ==========================================
// Jen's Pastry Shop - Unified Responsive Dashboard Layout
// Supports Customer, Cashier, Baker, and Admin with role-specific navigation
// Responsive sidebar, mobile drawer, role badge, and user controls
// ==========================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { ROLE_LABELS, ROLES } from '../constants/roles.js';
import { 
  Croissant, 
  Menu, 
  X, 
  LogOut, 
  User as UserIcon, 
  ChevronRight,
  Shield,
  Sparkles
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

  const displayName = userProfile?.fullName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const roleLabel = ROLE_LABELS[role] || role;

  const getRoleBadgeClass = () => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case ROLES.CASHIER:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case ROLES.BAKER:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-pink-100 text-primary border-border-light';
    }
  };

  return (
    <div className="dashboard-shell flex flex-col h-full bg-cream">
      {/* Top Navbar */}
      <header className="dashboard-topbar flex items-center justify-between px-4 py-3 bg-[#333842] text-white shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden text-white/80 hover:text-white p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center text-primary-dark shadow-sm">
              <Croissant size={18} className="text-[#831843]" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[#FBCFE8] font-serif block leading-none">
                BAKEOLOGY
              </span>
              <span className="text-2xs text-[#F9A8D4] block mt-0.5 font-sans">
                Jen's Pastry Shop
              </span>
            </div>
          </div>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-white truncate max-w-[130px]">
              {displayName}
            </span>
            <span className="text-2xs text-pink-200">
              {roleLabel}
            </span>
          </div>

          <span className={`text-2xs font-extrabold px-2 py-0.5 rounded-full border ${getRoleBadgeClass()} shadow-2xs capitalize`}>
            {role}
          </span>

          <button
            type="button"
            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
            onClick={handleLogout}
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar + Workspace */}
      <div className="dashboard-container flex flex-1 overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {mobileMenuOpen && (
          <div
            className="mobile-drawer-backdrop md:hidden absolute inset-0 bg-black/50 z-20 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`dashboard-sidebar w-64 bg-card border-r border-border-light flex flex-col justify-between z-30 transition-transform duration-200 absolute md:relative inset-y-0 left-0 ${
            mobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Navigation Items */}
          <div className="py-4 px-3 space-y-1 overflow-y-auto flex-1">
            <div className="px-3 pb-2 text-2xs font-bold uppercase tracking-wider text-muted flex items-center justify-between">
              <span>{roleLabel} Menu</span>
              <Sparkles size={11} className="text-primary" />
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon || ChevronRight;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'text-text-primary hover:bg-beige text-muted hover:text-primary'
                  }`}
                  onClick={() => {
                    onSelectItem(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-white' : 'text-primary'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-2xs px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-pink-100 text-primary'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer User Info */}
          <div className="p-3 border-t border-border-light bg-cream-pure">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border-light">
              <div className="w-8 h-8 rounded-full bg-pink-100 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {displayName[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-primary truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-2xs text-muted truncate">
                  {currentUser?.email}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Workspace */}
        <main className="dashboard-content-area flex-1 flex flex-col overflow-y-auto bg-cream">
          {/* Header Banner */}
          {(title || headerActions) && (
            <div className="dashboard-content-header px-4 py-3 bg-card border-b border-border-light flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div>
                <h1 className="text-base font-extrabold text-primary font-serif">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-2xs text-muted">
                    {subtitle}
                  </p>
                )}
              </div>
              {headerActions && (
                <div className="flex items-center gap-2">
                  {headerActions}
                </div>
              )}
            </div>
          )}

          {/* Scrollable Children Canvas */}
          <div className="p-4 flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
