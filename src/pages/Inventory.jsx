// ==========================================
// Jen's Pastry Shop - Inventory Page
// Mobile inventory tracking with visual status badges & restock
// ==========================================

import React, { useState, useMemo } from 'react';
import { Search, PackagePlus, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters.js';

export default function Inventory({ products, onOpenRestockModal }) {
  // VARIABLES: Search and Status filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'in_stock' | 'low_stock' | 'out_of_stock'

  // FUNCTIONS: Determine item status badge & category
  const getItemStatus = (stock) => {
    if (stock === 0) return { key: 'out_of_stock', label: 'Out of Stock', badgeClass: 'badge-danger', icon: '🔴' };
    if (stock <= 10) return { key: 'low_stock', label: 'Low Stock', badgeClass: 'badge-warning', icon: '🟠' };
    return { key: 'in_stock', label: 'In Stock', badgeClass: 'badge-success', icon: '🟢' };
  };

  // Compute counts for status tabs
  const counts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalUnits = 0;

    products.forEach(p => {
      totalUnits += p.stock;
      if (p.stock === 0) outOfStock++;
      else if (p.stock <= 10) lowStock++;
      else inStock++;
    });

    return { inStock, lowStock, outOfStock, totalUnits };
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusInfo = getItemStatus(product.stock);
      const matchesStatus = statusFilter === 'All' || statusInfo.key === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, statusFilter]);

  return (
    <div className="page-content inventory-page space-y-4">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-main-title">Inventory Status</h2>
          <p className="page-main-sub">{counts.totalUnits.toLocaleString()} total units on shelves</p>
        </div>
      </div>

      {/* Mini Status Metric Counters */}
      <div className="inventory-stats-strip">
        <div 
          className={`stat-pill ${statusFilter === 'All' ? 'stat-pill-active' : ''}`}
          onClick={() => setStatusFilter('All')}
        >
          <span className="stat-pill-label">All</span>
          <span className="stat-pill-num">{products.length}</span>
        </div>
        <div 
          className={`stat-pill stat-pill-success ${statusFilter === 'in_stock' ? 'stat-pill-active' : ''}`}
          onClick={() => setStatusFilter('in_stock')}
        >
          <span className="stat-pill-label">🟢 In Stock</span>
          <span className="stat-pill-num">{counts.inStock}</span>
        </div>
        <div 
          className={`stat-pill stat-pill-warning ${statusFilter === 'low_stock' ? 'stat-pill-active' : ''}`}
          onClick={() => setStatusFilter('low_stock')}
        >
          <span className="stat-pill-label">🟠 Low Stock</span>
          <span className="stat-pill-num">{counts.lowStock}</span>
        </div>
        <div 
          className={`stat-pill stat-pill-danger ${statusFilter === 'out_of_stock' ? 'stat-pill-active' : ''}`}
          onClick={() => setStatusFilter('out_of_stock')}
        >
          <span className="stat-pill-label">🔴 Out of Stock</span>
          <span className="stat-pill-num">{counts.outOfStock}</span>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="search-bar-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Filter inventory by pastry..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            type="button" 
            className="search-clear-btn" 
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Mobile Inventory Cards List */}
      <div className="inventory-list space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const status = getItemStatus(product.stock);

            return (
              <div key={product.id} className="mobile-card inventory-card">
                <div className="inventory-card-top">
                  <div className="inventory-info-col">
                    <h3 className="inventory-item-title">{product.name}</h3>
                    <div className="inventory-meta-row flex gap-2 items-center">
                      <span className="category-badge">{product.category}</span>
                      <span className="text-xs text-muted font-medium">
                        Unit Price: {formatCurrency(product.price)}
                      </span>
                    </div>
                  </div>

                  <div className="inventory-badge-col">
                    <span className={`badge ${status.badgeClass} flex items-center gap-1`}>
                      <span>{status.icon}</span>
                      <span>{status.label}</span>
                    </span>
                  </div>
                </div>

                <div className="inventory-card-bottom flex justify-between items-center mt-3 pt-3 border-t border-border-light">
                  <div className="inventory-stock-count">
                    <span className="text-xs text-muted block">Available Stock</span>
                    <span className="text-xl font-bold text-primary font-mono">{product.stock}</span>
                    <span className="text-xs text-muted ml-1">units</span>
                  </div>

                  <button
                    type="button"
                    className="btn-action-primary flex items-center gap-1.5"
                    onClick={() => onOpenRestockModal(product)}
                    title="Add baked batch"
                  >
                    <PackagePlus size={16} />
                    <span>Restock</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="mobile-card empty-state-card text-center py-8">
            <span className="text-4xl mb-2 block">📦</span>
            <h3 className="font-semibold text-lg mb-1">No Inventory Items Found</h3>
            <p className="text-sm text-muted mb-4">
              Try adjusting your search query or status filter.
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
