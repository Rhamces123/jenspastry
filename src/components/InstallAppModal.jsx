// ==========================================
// BAKEOLOGY - Install App Modal
// Enables downloading/installing the app onto Android, iOS, & Desktop
// ==========================================

import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, CheckCircle, X, QrCode, Monitor } from 'lucide-react';

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

function checkIsInstalled() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true
  );
}

export default function InstallAppModal({ isOpen, onClose, deferredPrompt, onInstallSuccess }) {
  const [platform, setPlatform] = useState(detectPlatform);
  const [isInstalled, setIsInstalled] = useState(checkIsInstalled);
  const networkUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (!isOpen) return null;

  // Handle Android / Chrome direct install trigger
  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          if (onInstallSuccess) onInstallSuccess();
          setIsInstalled(true);
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
        className="modal-content mobile-card" 
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="header-logo-badge w-7 h-7">
              <Download size={16} />
            </div>
            <h3 className="modal-title">Download to Device</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          {isInstalled ? (
            <div className="text-center py-4 bg-success-soft p-4 rounded-xl">
              <CheckCircle size={36} className="text-success inline mb-2" />
              <h4 className="font-bold text-base text-success">App Already Installed!</h4>
              <p className="text-xs text-muted mt-1">
                BAKEOLOGY is installed on this device. You can launch it directly from your home screen or app drawer.
              </p>
            </div>
          ) : (
            <>
              {/* App Preview Banner */}
              <div className="flex items-center gap-3 p-3 bg-cream rounded-xl border border-border-light">
                <img 
                  src="/icon-192.png" 
                  alt="App Icon" 
                  className="w-14 h-14 rounded-2xl shadow-sm border border-border-medium"
                />
                <div>
                  <h4 className="font-bold text-sm text-primary">BAKEOLOGY</h4>
                  <p className="text-2xs text-muted">Pastry Shop Management System</p>
                  <span className="badge badge-success text-2xs mt-1">✓ Standalone Mobile App</span>
                </div>
              </div>

              {/* Platform Selector Tabs */}
              <div className="flex bg-beige p-1 rounded-lg gap-1 text-xs font-semibold">
                <button
                  type="button"
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 ${platform === 'android' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}
                  onClick={() => setPlatform('android')}
                >
                  <Smartphone size={14} /> Android
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 ${platform === 'ios' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}
                  onClick={() => setPlatform('ios')}
                >
                  <Share2 size={14} /> iPhone / iOS
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1 ${platform === 'desktop' ? 'bg-card text-primary shadow-sm' : 'text-muted'}`}
                  onClick={() => setPlatform('desktop')}
                >
                  <Monitor size={14} /> PC / Mac
                </button>
              </div>

              {/* Android Instructions / 1-Click Install */}
              {platform === 'android' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted">
                    Install BAKEOLOGY directly to your Android phone home screen with its own icon and full-screen view:
                  </p>

                  {deferredPrompt ? (
                    <button
                      type="button"
                      className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-md"
                      onClick={handleNativeInstall}
                    >
                      <Download size={18} />
                      <span>Install App Now (1-Tap)</span>
                    </button>
                  ) : (
                    <div className="bg-cream-pure p-3 rounded-lg border border-border-light space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-accent">1.</span>
                        <span>Open this page in <strong>Google Chrome</strong> on your phone.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-accent">2.</span>
                        <span>Tap the <strong>three dots menu (⋮)</strong> in the top-right corner.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-accent">3.</span>
                        <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-accent">4.</span>
                        <span>Tap <strong>Install</strong>. The icon will appear in your phone's app list!</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* iOS (iPhone / iPad) Instructions */}
              {platform === 'ios' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted">
                    Follow these 3 simple steps in <strong>Safari</strong> on your iPhone or iPad:
                  </p>

                  <div className="bg-cream-pure p-3.5 rounded-lg border border-border-light space-y-2.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div>
                        Tap the <strong>Share button</strong> <Share2 size={13} className="inline text-accent mx-0.5" /> in the bottom bar of Safari.
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div>
                        Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={13} className="inline text-primary mx-0.5" />.
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div>
                        Tap <strong>"Add"</strong> in the top-right corner.
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-beige rounded-lg text-2xs text-muted text-center">
                    💡 The app icon will appear on your iPhone screen and launches full-screen without Safari toolbars!
                  </div>
                </div>
              )}

              {/* Desktop (PC / Mac) Instructions + Mobile QR Code */}
              {platform === 'desktop' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted">
                    To install on this computer or scan to install on your mobile phone:
                  </p>

                  {deferredPrompt && (
                    <button
                      type="button"
                      className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold shadow-md"
                      onClick={handleNativeInstall}
                    >
                      <Download size={16} />
                      <span>Install on this Computer</span>
                    </button>
                  )}

                  <div className="p-3 bg-cream-pure rounded-lg border border-border-light text-center space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary">
                      <QrCode size={16} />
                      <span>Scan to Open on your Phone</span>
                    </div>

                    <div className="flex justify-center py-1">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(networkUrl)}`}
                        alt="QR Code to open app on phone"
                        className="w-32 h-32 rounded-lg border border-border-medium shadow-sm bg-white p-1"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>

                    <p className="text-2xs text-muted font-mono break-all">
                      {networkUrl}
                    </p>
                    <p className="text-2xs text-muted">
                      (Make sure phone & PC are on the same Wi-Fi)
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
