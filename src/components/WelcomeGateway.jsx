// ==========================================
// BAKEOLOGY - Welcome Gateway Component
// Displayed to visitors/guests: Only shows Login, Sign Up, and Install Button
// 100x Modern, delightful artisanal pastry portal
// ==========================================

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Croissant, 
  LogIn, 
  UserPlus, 
  Download, 
  Sparkles, 
  ArrowRight,
  Heart
} from 'lucide-react';

export default function WelcomeGateway({ onOpenInstallModal, isInstalled = false }) {
  return (
    <div className="welcome-gateway-container">
      <div className="welcome-gateway-card">
        {/* Animated Pastry Hero Badge */}
        <div className="welcome-hero-badge">
          <Croissant size={34} />
        </div>

        {/* Brand Titles */}
        <h1 className="welcome-brand-title">BAKEOLOGY</h1>
        <p className="welcome-brand-sub">Jen's Pastry Shop</p>
        <p className="welcome-brand-desc">
          Handcrafted artisanal breads, delicate pastries, and sweet oven delights baked fresh every morning with love.
        </p>

        {/* 1. Install BAKEOLOGY App Banner (Featured if not installed) */}
        {!isInstalled && (
          <div 
            className="welcome-install-banner"
            onClick={onOpenInstallModal}
            role="button"
            tabIndex={0}
            aria-label="Install BAKEOLOGY App to home screen"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onOpenInstallModal();
              }
            }}
          >
            <div className="welcome-install-icon">
              <Download size={20} />
            </div>
            <div className="welcome-install-text">
              <div className="welcome-install-title">Install BAKEOLOGY App</div>
              <div className="welcome-install-desc">Fast 1-tap access on mobile • Works offline</div>
            </div>
            <span className="btn-welcome-install-pill">
              <span>Install</span>
              <ArrowRight size={13} />
            </span>
          </div>
        )}

        {/* 2 & 3. Primary Actions: Sign In & Create Account */}
        <div className="welcome-action-buttons">
          {/* Sign In Button */}
          <Link to="/login" className="btn-welcome-primary">
            <div className="welcome-btn-content">
              <div className="welcome-btn-icon-wrap">
                <LogIn size={20} />
              </div>
              <div>
                <div className="welcome-btn-title">Sign In</div>
                <div className="welcome-btn-sub">Access your pastry account & order tracking</div>
              </div>
            </div>
            <ArrowRight size={18} className="shrink-0" />
          </Link>

          {/* Create Account Button */}
          <Link to="/signup" className="btn-welcome-secondary">
            <div className="welcome-btn-content">
              <div className="welcome-btn-icon-wrap">
                <UserPlus size={20} />
              </div>
              <div>
                <div className="welcome-btn-title">Create Account</div>
                <div className="welcome-btn-sub">Join the Pastry Club for sweet rewards</div>
              </div>
            </div>
            <ArrowRight size={18} className="shrink-0 text-primary" />
          </Link>
        </div>

        {/* Sweet Pastry Highlights */}
        <div className="welcome-perks-row">
          <span className="welcome-perk-pill">
            <Croissant size={12} /> Fresh Daily Bakes
          </span>
          <span className="welcome-perk-pill">
            <Sparkles size={12} /> Member Perks
          </span>
          <span className="welcome-perk-pill">
            <Heart size={12} /> Made with Love
          </span>
        </div>
      </div>
    </div>
  );
}
