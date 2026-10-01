// ==========================================
// Jen's Pastry Shop - Cart Item Component
// Mobile touch-friendly cart row with quantity controls
// ==========================================

import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters.js';

export default function CartItem({ item, onIncrease, onDecrease, onRemove, availableStock }) {
  const lineTotal = item.product.price * item.quantity;
  const isMaxStockReached = item.quantity >= availableStock;

  return (
    <div className="cart-item-card">
      <div className="cart-item-header">
        <div className="cart-item-info">
          <span className="cart-item-name">{item.product.name}</span>
          <span className="cart-item-unit-price">
            {formatCurrency(item.product.price)} each • Max: {availableStock}
          </span>
        </div>
        <button
          type="button"
          className="cart-item-remove-btn"
          onClick={() => onRemove(item.product.id)}
          aria-label={`Remove ${item.product.name} from cart`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="cart-item-footer">
        {/* Quantity Controls */}
        <div className="quantity-control-group">
          <button
            type="button"
            className="qty-btn"
            onClick={() => onDecrease(item.product.id)}
            disabled={item.quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="qty-value">{item.quantity}</span>
          <button
            type="button"
            className={`qty-btn ${isMaxStockReached ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onIncrease(item.product.id)}
            disabled={isMaxStockReached}
            aria-label="Increase quantity"
            title={isMaxStockReached ? 'Reached max available stock' : 'Add one more'}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Line Total */}
        <div className="cart-item-total">
          <span className="cart-line-total">{formatCurrency(lineTotal)}</span>
        </div>
      </div>

      {isMaxStockReached && (
        <div className="stock-limit-warning">
          <small>⚠️ Maximum available stock reached ({availableStock} units)</small>
        </div>
      )}
    </div>
  );
}
