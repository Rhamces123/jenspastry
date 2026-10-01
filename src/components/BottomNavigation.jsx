// ==========================================
// Jen's Pastry Shop - Bottom Navigation
// Fixed mobile navigation bar with active indicators
// ==========================================

import React from 'react';
import { Home, Croissant, Package, ShoppingCart } from 'lucide-react';

export default function BottomNavigation({ currentTab, onSelectTab, cartCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'products', label: 'Products', icon: Croissant },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingCart, badge: cartCount }
  ];

  return (
    <nav className="bottom-nav-container" aria-label="Bottom Navigation">
      <div className="bottom-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-icon-wrapper">
                <Icon size={22} className="nav-icon" />
                {item.badge > 0 && (
                  <span className="nav-badge" aria-label={`${item.badge} items in cart`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
