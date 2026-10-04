// ==========================================
// Jen's Pastry Shop - Header Component
// Mobile app header with branding & pattern guide
// ==========================================

import React, { useState } from 'react';
import { Croissant, Info, RotateCcw, Sparkles, Download } from 'lucide-react';

export default function Header({ onResetData, onOpenInstallModal, isInstalled = false }) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      <header className="mobile-header">
        <div className="header-brand">
          <div className="header-logo-badge">
            <Croissant className="header-icon" size={24} />
          </div>
          <div className="header-titles">
            <h1 className="header-title">BAKEOLOGY</h1>
            <p className="header-subtitle">Pastry Shop Management System</p>
          </div>
        </div>

        <div className="header-actions flex items-center gap-1.5">
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
