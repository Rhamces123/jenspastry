// ==========================================
// BAKEOLOGY - Install App Modal
// Enables downloading/installing the app onto Android, iOS, & Desktop
// ==========================================

import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, CheckCircle, X, QrCode, Monitor } from 'lucide-react';

import { checkIsAppInstalled, markAppAsInstalled } from '../utils/pwa.js';

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'desktop';
  const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return 'ios';
  }
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  return 'desktop';
}

export default function InstallAppModal({ isOpen, onClose, deferredPrompt, onInstallSuccess, isInstalled: propIsInstalled }) {
  const [platform, setPlatform] = useState(detectPlatform);
  const [internalInstalled, setInternalInstalled] = useState(checkIsAppInstalled);
  const isInstalled = propIsInstalled ?? internalInstalled;
  const networkUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (!isOpen) return null;

  // Handle Android / Chrome direct install trigger
  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          markAppAsInstalled();
          setInternalInstalled(true);
          if (onInstallSuccess) onInstallSuccess();
          onClose();
        }
      } catch (err) {
        console.warn("Install prompt error:", err);
      }
    } else {
      alert("To install: Open browser menu (⋮) and tap 'Install app' or 'Add to Home screen'.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content install-modal-content" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="install-modal-title"
      >
        <div className="modal-header">
          <div className="install-header-left">
            <div className="install-header-icon">
              <Download size={18} />
            </div>
            <div>
              <h3 id="install-modal-title" className="modal-title">Download App</h3>
              <p className="install-header-subtitle">Install to home screen for 1-tap ordering</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          {isInstalled ? (
            <div className="install-success-banner">
              <CheckCircle size={40} className="text-success" />
              <h4 className="install-success-title">App Already Installed!</h4>
              <p className="install-success-desc">
                BAKEOLOGY is installed on this device. You can launch it directly from your home screen or app drawer.
              </p>
            </div>
          ) : (
            <>
              {/* App Preview Card */}
              <div className="install-preview-card">
                <div className="install-preview-icon-wrapper">
                  <img 
                    src="/icon-192.png" 
                    alt="BAKEOLOGY App Icon" 
                    className="install-preview-icon"
                    width="56"
                    height="56"
                  />
                </div>
                <div className="install-preview-details">
                  <h4 className="install-preview-brand">Jen's Pastry Shop</h4>
                  <p className="install-preview-subtitle">BAKEOLOGY • Mobile Pastry Ordering</p>
                  <div className="install-preview-badges">
                    <span className="install-badge-pwa">✓ Standalone App</span>
                    <span className="install-badge-offline">⚡ Fast & Offline Ready</span>
                  </div>
                </div>
              </div>

              {/* Platform Selector Tabs */}
              <div className="install-platform-tabs">
                <button
                  type="button"
                  className={`install-platform-tab ${platform === 'android' ? 'active' : ''}`}
                  onClick={() => setPlatform('android')}
                >
                  <Smartphone size={15} />
                  <span>Android</span>
                </button>
                <button
                  type="button"
                  className={`install-platform-tab ${platform === 'ios' ? 'active' : ''}`}
                  onClick={() => setPlatform('ios')}
                >
                  <Share2 size={15} />
                  <span>iPhone / iOS</span>
                </button>
                <button
                  type="button"
                  className={`install-platform-tab ${platform === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPlatform('desktop')}
                >
                  <Monitor size={15} />
                  <span>PC / Mac</span>
                </button>
              </div>

              {/* Android Instructions / 1-Click Install */}
              {platform === 'android' && (
                <div className="install-section">
                  <p className="install-section-note">
                    Install BAKEOLOGY directly onto your Android device for a fast, full-screen bakery app experience:
                  </p>

                  {deferredPrompt ? (
                    <button
                      type="button"
                      className="install-primary-action-btn"
                      onClick={handleNativeInstall}
                    >
                      <Download size={18} />
                      <span>Install App Now (1-Tap)</span>
                    </button>
                  ) : (
                    <div className="install-steps-card">
                      <div className="install-step-item">
                        <span className="install-step-badge">1</span>
                        <div className="install-step-body">Open this page in <strong>Google Chrome</strong> on your phone.</div>
                      </div>
                      <div className="install-step-item">
                        <span className="install-step-badge">2</span>
                        <div className="install-step-body">Tap the <strong>three dots menu (⋮)</strong> in the top-right corner.</div>
                      </div>
                      <div className="install-step-item">
                        <span className="install-step-badge">3</span>
                        <div className="install-step-body">Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</div>
                      </div>
                      <div className="install-step-item">
                        <span className="install-step-badge">4</span>
                        <div className="install-step-body">Tap <strong>Install</strong>. The icon will appear right on your home screen!</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* iOS (iPhone / iPad) Instructions */}
              {platform === 'ios' && (
                <div className="install-section">
                  <p className="install-section-note">
                    Follow these 3 simple steps in <strong>Safari</strong> on your iPhone or iPad:
                  </p>

                  <div className="install-steps-card">
                    <div className="install-step-item">
                      <span className="install-step-badge">1</span>
                      <div className="install-step-body">
                        Tap the <strong>Share button</strong> <Share2 size={13} className="install-inline-icon" /> in Safari's bottom bar.
                      </div>
                    </div>

                    <div className="install-step-item">
                      <span className="install-step-badge">2</span>
                      <div className="install-step-body">
                        Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={13} className="install-inline-icon" />.
                      </div>
                    </div>

                    <div className="install-step-item">
                      <span className="install-step-badge">3</span>
                      <div className="install-step-body">
                        Tap <strong>"Add"</strong> in the top-right corner.
                      </div>
                    </div>
                  </div>

                  <div className="install-tip-box">
                    💡 The app icon will appear on your iPhone screen and launches full-screen without Safari browser bars!
                  </div>
                </div>
              )}

              {/* Desktop (PC / Mac) Instructions + Mobile QR Code */}
              {platform === 'desktop' && (
                <div className="install-section">
                  <p className="install-section-note">
                    Install on this computer or scan the QR code to open & install on your phone:
                  </p>

                  {deferredPrompt && (
                    <button
                      type="button"
                      className="install-primary-action-btn mb-2"
                      onClick={handleNativeInstall}
                    >
                      <Download size={16} />
                      <span>Install on this Computer</span>
                    </button>
                  )}

                  <div className="install-qr-card">
                    <div className="install-qr-heading">
                      <QrCode size={16} />
                      <span>Scan with your Phone Camera</span>
                    </div>

                    <div className="install-qr-box">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(networkUrl)}`}
                        alt="QR Code to open app on phone"
                        className="install-qr-img"
                        width="130"
                        height="130"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>

                    <p className="install-qr-url">
                      {networkUrl}
                    </p>
                    <p className="install-qr-hint">
                      Make sure your phone and computer are on the same network or open the link directly.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer mt-4">
          <button 
            type="button" 
            className="btn-secondary w-full"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
