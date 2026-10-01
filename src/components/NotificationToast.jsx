// ==========================================
// Jen's Pastry Shop - Notification Toast
// Touch-friendly floating feedback alert
// ==========================================

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'error': return <AlertCircle size={18} className="text-danger" />;
      case 'info': return <Info size={18} className="text-primary" />;
      case 'success':
      default: return <CheckCircle2 size={18} className="text-success" />;
    }
  };

  return (
    <div className={`toast-banner toast-${type}`} role="alert">
      <div className="flex items-center gap-2 flex-1">
        {getIcon()}
        <span className="toast-text">{message}</span>
      </div>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close notification">
        <X size={16} />
      </button>
    </div>
  );
}
