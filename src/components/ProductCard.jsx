// ==========================================
// Jen's Pastry Shop - Product Card
// Mobile card displaying single product with actions
// ==========================================

import React from 'react';
import { Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters.js';

export default function ProductCard({ product, onEdit, onDelete, onQuickAddToCart }) {
  // Stock status styling
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'Bread': return '🍞';
      case 'Cake': return '🍰';
      case 'Dessert': return '🍮';
      case 'Beverage': return '☕';
      case 'Pastry':
      default: return '🥐';
    }
  };

  return (
    <div className={`mobile-card product-card ${isOutOfStock ? 'card-out-of-stock' : ''}`}>
      <div className="product-card-top">
        <div className="product-info-col">
          <div className="flex items-center gap-2">
            <span className="product-category-icon" role="img" aria-label={product.category}>
              {getCategoryEmoji(product.category)}
            </span>
            <h3 className="product-title">{product.name}</h3>
          </div>
          <span className="category-badge">{product.category}</span>
        </div>

        <div className="product-price-col">
          <span className="product-price">{formatCurrency(product.price)}</span>
        </div>
      </div>

      <div className="product-card-middle">
        <div className="product-stock-row">
          <span className="stock-label">Stock: <strong>{product.stock}</strong></span>
          {isOutOfStock ? (
            <span className="badge badge-danger">Out of Stock</span>
          ) : isLowStock ? (
            <span className="badge badge-warning">
              <AlertTriangle size={12} className="inline mr-1" /> Low Stock
            </span>
          ) : (
            <span className="badge badge-success">In Stock</span>
          )}
        </div>
      </div>

      <div className="product-card-actions">
        {onQuickAddToCart && !isOutOfStock && (
          <button
            type="button"
            className="btn-action-primary flex-1"
            onClick={() => onQuickAddToCart(product)}
            title="Add to sales cart"
          >
            + Add to Cart
          </button>
        )}
        <button
          type="button"
          className="btn-action-outline"
          onClick={() => onEdit(product)}
          aria-label={`Edit ${product.name}`}
        >
          <Edit2 size={16} /> Edit
        </button>
        <button
          type="button"
          className="btn-action-danger"
          onClick={() => onDelete(product)}
          aria-label={`Delete ${product.name}`}
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  );
}
