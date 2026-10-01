// ==========================================
// Jen's Pastry Shop - Dashboard Page
// Mobile management dashboard with key metrics & alerts
// ==========================================

import React from 'react';
import DashboardCard from '../components/DashboardCard.jsx';
import { 
  Package, 
  Layers, 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart, 
  Plus, 
  Receipt,
  ArrowRight,
  Sparkles,
  Download
} from 'lucide-react';
import { formatCurrency, formatSaleNumber, formatDateTime } from '../utils/formatters.js';

export default function Dashboard({ 
  summary, 
  onNavigateTab, 
  onOpenAddModal, 
  onViewReceipt,
  onOpenInstallModal 
}) {
  const { 
    totalProducts, 
    inventoryItems, 
    todaySales, 
    lowStockCount, 
    lowStockProducts, 
    recentSales 
  } = summary;

  return (
    <div className="page-content dashboard-page space-y-5">
      {/* Welcome Banner */}
      <div className="welcome-banner mobile-card">
        <div className="welcome-content">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-secondary" />
            <span className="text-xs uppercase tracking-wider font-semibold text-muted">Bakeshop Overview</span>
          </div>
          <h2 className="welcome-title">Good day, Baker! 🥐</h2>
          <p className="welcome-sub">Here is your daily pastry shop performance and inventory status.</p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="summary-grid">
        <DashboardCard
          title="Total Products"
          value={totalProducts}
          subtitle="Active catalog items"
          icon={Layers}
          colorTheme="brown"
          onClick={() => onNavigateTab('products')}
        />
        <DashboardCard
          title="Inventory Items"
          value={inventoryItems.toLocaleString()}
          subtitle="Total stock units"
          icon={Package}
          colorTheme="beige"
          onClick={() => onNavigateTab('inventory')}
        />
        <DashboardCard
          title="Today's Sales"
          value={formatCurrency(todaySales)}
          subtitle="Completed transactions"
          icon={TrendingUp}
          colorTheme="orange"
          onClick={() => onNavigateTab('sales')}
        />
        <DashboardCard
          title="Low Stock"
          value={lowStockCount}
          subtitle={lowStockCount > 0 ? "Requires baking" : "Stock is healthy"}
          icon={AlertTriangle}
          colorTheme={lowStockCount > 0 ? "warning" : "success"}
          onClick={() => onNavigateTab('inventory')}
        />
      </div>

      {/* Download / Install App Banner */}
      <div 
        className="mobile-card install-app-banner flex items-center justify-between cursor-pointer"
        onClick={onOpenInstallModal}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          <div className="install-banner-icon">
            <Download size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-primary">Download to Device</h4>
            <p className="text-2xs text-muted">Install for 1-tap offline mobile access</p>
          </div>
        </div>
        <span className="btn-action-primary text-xs font-bold py-1 px-3">
          Install
        </span>
      </div>

      {/* Quick Action Buttons for Touch */}
      <div className="quick-actions-bar">
        <button
          type="button"
          className="btn-quick-action"
          onClick={() => onNavigateTab('sales')}
        >
          <div className="btn-quick-icon bg-orange-soft">
            <ShoppingCart size={18} />
          </div>
          <span>New Sale</span>
        </button>

        <button
          type="button"
          className="btn-quick-action"
          onClick={onOpenAddModal}
        >
          <div className="btn-quick-icon bg-brown-soft">
            <Plus size={18} />
          </div>
          <span>Add Pastry</span>
        </button>

        <button
          type="button"
          className="btn-quick-action"
          onClick={() => onNavigateTab('inventory')}
        >
          <div className="btn-quick-icon bg-beige-soft">
            <Package size={18} />
          </div>
          <span>Check Stock</span>
        </button>
      </div>

      {/* Low Stock Warning Section */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <div className="mobile-card warning-card">
          <div className="card-header-row mb-2">
            <div className="flex items-center gap-2">
              <div className="warning-badge-icon">
                <AlertTriangle size={18} />
              </div>
              <h3 className="section-title text-warning-dark">Low Stock Warning</h3>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-warning-dark flex items-center gap-1"
              onClick={() => onNavigateTab('inventory')}
            >
              Restock <ArrowRight size={14} />
            </button>
          </div>

          <p className="text-xs text-muted mb-3">
            The following items have reached 10 or fewer units in stock and need a fresh batch:
          </p>

          <div className="low-stock-items-list space-y-2">
            {lowStockProducts.map(item => (
              <div key={item.id} className="low-stock-item-pill">
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.icon || '🥐'}</span>
                  <div>
                    <span className="font-semibold text-sm">{item.name}</span>
                    <span className="text-xs text-muted block">{item.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${item.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                    {item.stock === 0 ? 'Out of Stock' : `${item.stock} left`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sales Section */}
      <div className="mobile-card recent-sales-card">
        <div className="card-header-row mb-3">
          <div className="flex items-center gap-2">
            <div className="recent-sales-icon">
              <Receipt size={18} />
            </div>
            <h3 className="section-title">Recent Sales</h3>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-primary flex items-center gap-1"
            onClick={() => onNavigateTab('sales')}
          >
            All Sales <ArrowRight size={14} />
          </button>
        </div>

        {recentSales && recentSales.length > 0 ? (
          <div className="recent-sales-list space-y-2">
            {recentSales.map(sale => (
              <div 
                key={sale.id} 
                className="recent-sale-row"
                onClick={() => onViewReceipt && onViewReceipt(sale)}
                title="Tap to view receipt"
              >
                <div className="flex items-center gap-3">
                  <div className="sale-receipt-icon">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <span className="sale-number-text">{formatSaleNumber(sale.saleNumber || sale.id)}</span>
                    <span className="sale-date-sub">{formatDateTime(sale.date)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="sale-amount-text">{formatCurrency(sale.total)}</span>
                  <span className="sale-customer-sub block">{sale.customerType}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-small py-4 text-center">
            <p className="text-sm text-muted">No sales recorded yet today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
