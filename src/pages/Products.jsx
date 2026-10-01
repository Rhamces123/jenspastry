// ==========================================
// Jen's Pastry Shop - Products Page
// Product management: search, filter, add, edit, delete
// ==========================================

import React, { useState, useMemo } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { Search, Plus, X } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../patterns/PastryProductFactory.js';

export default function Products({ 
  products, 
  onOpenAddModal, 
  onEditProduct, 
  onDeleteProduct,
  onQuickAddToCart 
}) {
  // VARIABLES: Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter categories list: 'All' + individual categories
  const filterTabs = ['All', ...PRODUCT_CATEGORIES];

  // FUNCTIONS: Filtered and searched product array
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <div className="page-content products-page space-y-4">
      {/* Top Action Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-main-title">Pastry Catalog</h2>
          <p className="page-main-sub">{products.length} products available</p>
        </div>

        <button
          type="button"
          className="btn-primary btn-add-pill"
          onClick={onOpenAddModal}
          aria-label="Add new product"
        >
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Mobile Search Bar */}
      <div className="search-bar-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search pastry by name or category..."
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

      {/* Category Filter Pills (Horizontal scrollable on mobile) */}
      <div className="category-scroll-container">
        <div className="category-scroll-list">
          {filterTabs.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`category-pill ${isActive ? 'category-pill-active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'Bread' && '🥖 '}
                {cat === 'Pastry' && '🥐 '}
                {cat === 'Cake' && '🎂 '}
                {cat === 'Dessert' && '🍮 '}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products List (Mobile Cards) */}
      <div className="products-list space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={onEditProduct}
              onDelete={onDeleteProduct}
              onQuickAddToCart={onQuickAddToCart}
            />
          ))
        ) : (
          <div className="mobile-card empty-state-card text-center py-8">
            <span className="text-4xl mb-2 block">🔍</span>
            <h3 className="font-semibold text-lg mb-1">No Pastries Found</h3>
            <p className="text-sm text-muted mb-4">
              {searchTerm 
                ? `No products match "${searchTerm}".`
                : `No products in the ${selectedCategory} category.`}
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
