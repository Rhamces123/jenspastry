// ==========================================
// Jen's Pastry Shop - Quick Restock Modal
// Allows pastry shop staff to quickly add baked batches
// ==========================================

import React, { useState, useEffect } from 'react';
import { PackagePlus, X, Check } from 'lucide-react';

export default function QuickRestockModal({ isOpen, onClose, product, onConfirm }) {
  const [addedAmount, setAddedAmount] = useState(10);

  useEffect(() => {
    if (product) {
      setAddedAmount(10);
    }
  }, [product?.id]);

  if (!isOpen || !product) return null;

  const quickPills = [5, 10, 20, 50];

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const qty = parseInt(addedAmount, 10);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid positive quantity to restock.");
      return;
    }
    const currentStock = Number(product.stock) || 0;
    const newTotal = currentStock + qty;
    if (onConfirm) {
      onConfirm(product.id, newTotal, qty);
    }
  };

  const parsedAdded = parseInt(addedAmount, 10);
  const validAdded = !isNaN(parsedAdded) && parsedAdded > 0 ? parsedAdded : 0;
  const currentStock = Number(product.stock) || 0;
  const newTotalStock = currentStock + validAdded;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content mobile-card" 
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <PackagePlus size={20} className="text-primary" />
            <h3 className="modal-title">Restock Product</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-beige rounded-lg">
            <p className="font-semibold text-base text-text-primary">{product.name}</p>
            <p className="text-sm text-muted">Current Stock: <strong>{currentStock} units</strong></p>
          </div>

          <div className="form-group">
            <label className="form-label">Add Fresh Batch (units):</label>
            <div className="flex gap-2 mb-2">
              {quickPills.map(val => (
                <button
                  key={val}
                  type="button"
                  className={`pill-btn flex-1 ${parsedAdded === val ? 'pill-active' : ''}`}
                  onClick={() => setAddedAmount(val)}
                >
                  +{val}
                </button>
              ))}
            </div>

            <input
              type="number"
              min="1"
              className="form-input"
              value={addedAmount}
              onChange={e => setAddedAmount(e.target.value)}
              placeholder="Enter custom quantity"
              autoFocus
            />
          </div>

          <p className="text-sm text-muted">
            New total stock will be: <strong className="text-primary font-bold">{newTotalStock} units</strong>
          </p>

          <div className="modal-actions">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              onClick={handleSubmit} 
              className="btn-primary flex-1 flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              <span>Confirm Restock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
