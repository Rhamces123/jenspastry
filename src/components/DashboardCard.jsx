// ==========================================
// Jen's Pastry Shop - Dashboard Summary Card
// ==========================================

import React from 'react';

export default function DashboardCard({ title, value, subtitle, icon: Icon, colorTheme = 'primary', onClick }) {
  return (
    <div 
      className={`summary-card summary-card-${colorTheme} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="summary-card-header">
        <span className="summary-card-title">{title}</span>
        {Icon && (
          <div className="summary-card-icon-wrap">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="summary-card-value">{value}</div>
      {subtitle && <div className="summary-card-subtitle">{subtitle}</div>}
    </div>
  );
}
