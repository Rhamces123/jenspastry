// ==========================================
// Jen's Pastry Shop - Header Component
// Mobile app header with branding & pattern guide
// ==========================================

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { 
  Croissant, 
  Info, 
  RotateCcw, 
  Sparkles, 
  Download, 
  User, 
  LogIn, 
  UserPlus, 
  ChevronDown, 
  ShoppingBag, 
  LogOut 
} from 'lucide-react';

export default function Header({ onResetData, onOpenInstallModal, isInstalled = false }) {
  const { currentUser, userProfile, logout } = useAuth();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password';

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const displayName = userProfile?.fullName || currentUser?.displayName || 'Customer';
  const initial = (displayName || currentUser?.email || 'C')[0].toUpperCase();

  return (
    <>
      <header className="mobile-header">
        <Link to="/" className="header-brand hover:opacity-95 transition-opacity" style={{ textDecoration: 'none' }}>
          <div className="header-logo-badge">
            <Croissant className="header-icon" size={24} />
          </div>
          <div className="header-titles">
            <h1 className="header-title">BAKEOLOGY</h1>
            <p className="header-subtitle">Pastry Shop Management System</p>
          </div>
        </Link>

        <div className="header-actions flex items-center gap-1.5">
          {/* Unauthenticated: Login & Sign Up buttons (or Store link when on auth pages) */}
          {!currentUser ? (
            isAuthPage ? (
              <Link 
                to="/"
                className="btn-header-auth btn-header-login"
                title="Return to Storefront"
              >
                <Croissant size={13} className="shrink-0" />
                <span>Store</span>
              </Link>
            ) : (
              <div className="flex items-center gap-1">
                <Link 
                  to="/login"
                  className="btn-header-auth btn-header-login"
                  title="Customer Sign In"
                >
                  <LogIn size={13} className="shrink-0" />
                  <span>Login</span>
                </Link>
                <Link 
                  to="/signup"
                  className="btn-header-auth btn-header-signup"
                  title="Create Account"
                >
                  <UserPlus size={13} className="shrink-0" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )
          ) : (
            /* Authenticated: Customer Profile Menu Dropdown */
            <div className="relative">
              <button 
                type="button"
                className="btn-header-profile"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-expanded={showUserMenu}
                aria-haspopup="true"
                title={`Account: ${displayName}`}
              >
                <div className="header-avatar-circle">
                  {initial}
                </div>
                <span className="header-user-name truncate">
                  {displayName.split(' ')[0]}
                </span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="dropdown-overlay" 
                    onClick={() => setShowUserMenu(false)} 
                  />
                  <div className="header-user-dropdown mobile-card">
                    <div className="dropdown-user-info">
                      <p className="font-bold text-xs text-primary truncate">
                        {displayName}
                      </p>
                      <p className="text-2xs text-muted truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <div className="dropdown-divider" />

                    <Link 
                      to="/account" 
                      className="dropdown-item" 
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User size={14} className="text-primary" />
                      <span>My Account</span>
                    </Link>

                    <Link 
                      to="/my-orders" 
                      className="dropdown-item" 
                      onClick={() => setShowUserMenu(false)}
                    >
                      <ShoppingBag size={14} className="text-primary" />
                      <span>My Orders</span>
                    </Link>

                    <div className="dropdown-divider" />

                    <button 
                      type="button" 
                      className="dropdown-item dropdown-logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {!isInstalled && (
            <button 
              type="button"
              className="btn-install-header"
              onClick={onOpenInstallModal}
              aria-label="Download / Install App to Phone"
              title="Download / Install App to Phone"
            >
              <Download size={14} />
              <span>Install</span>
            </button>
          )}

          <button 
            type="button"
            className="header-btn"
            onClick={() => setShowInfoModal(true)}
            aria-label="Design Patterns & Info"
            title="School Project & Design Patterns Info"
          >
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* Info / Design Patterns Modal */}
      {showInfoModal && (
        <div className="modal-backdrop" onClick={() => setShowInfoModal(false)}>
          <div className="modal-content mobile-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-primary" />
                <h3 className="modal-title">Design Patterns Guide</h3>
              </div>
              <button 
                type="button" 
                className="close-btn"
                onClick={() => setShowInfoModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body space-y-4">
              <p className="text-sm text-muted">
                College JavaScript & Design Patterns Project demonstrating 3 key GoF design patterns in a mobile management app:
              </p>

              <div className="pattern-pill-box">
                <h4 className="pattern-title">🏭 Factory Pattern</h4>
                <p className="pattern-code"><code>PastryProductFactory.createProduct()</code></p>
                <p className="pattern-desc">
                  Centralizes the creation of Bread, Pastry, Cake, and Dessert objects with validation and category attributes.
                </p>
              </div>

              <div className="pattern-pill-box">
                <h4 className="pattern-title">👑 Singleton Pattern</h4>
                <p className="pattern-code"><code>ShopManager.getInstance()</code></p>
                <p className="pattern-desc">
                  Guarantees exactly one instance exists to manage products, inventory, orders, and sales across all screens.
                </p>
              </div>

              <div className="pattern-pill-box">
                <h4 className="pattern-title">🎯 Strategy Pattern</h4>
                <p className="pattern-code"><code>Regular / Student / BulkOrderDiscountStrategy</code></p>
                <p className="pattern-desc">
                  Encapsulates distinct discount formulas (0%, 5%, 10%) into interchangeable strategy objects.
                </p>
              </div>

              <div className="divider"></div>

              <div className="reset-section">
                <p className="text-xs text-muted mb-2">Need to restore original demo data?</p>
                <button
                  type="button"
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    if (window.confirm("Reset all products and sales to initial demo sample state?")) {
                      onResetData();
                      setShowInfoModal(false);
                    }
                  }}
                >
                  <RotateCcw size={16} /> Reset Sample Data
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-primary w-full"
                onClick={() => setShowInfoModal(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
