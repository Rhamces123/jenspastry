// ==========================================
// Jen's Pastry Shop - Quick Restock Modal
// Allows pastry shop staff to quickly add baked batches
// ==========================================

import React, { useState } from 'react';
import { PackagePlus, X } from 'lucide-react';

export default function QuickRestockModal({ isOpen, onClose, product, onConfirm }) {
  const [addedAmount, setAddedAmount] = useState(10);

  if (!isOpen || !product) return null;

  const quickPills = [5, 10, 20, 50];

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = Number(addedAmount);
    if (!isNaN(qty) && qty > 0) {
      onConfirm(product.id, product.stock + qty);
      onClose();
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
            <PackagePlus size={20} className="text-primary" />
            <h3 className="modal-title">Restock Product</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-beige rounded-lg">
            <p className="font-semibold text-base">{product.name}</p>
            <p className="text-sm text-muted">Current Stock: <strong>{product.stock} units</strong></p>
          </div>

          <div className="form-group">
            <label className="form-label">Add Fresh Batch (units):</label>
            <div className="flex gap-2 mb-2">
              {quickPills.map(val => (
                <button
                  key={val}
                  type="button"
                  className={`pill-btn flex-1 ${Number(addedAmount) === val ? 'pill-active' : ''}`}
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
            />
          </div>

          <p className="text-sm text-muted">
            New total stock will be: <strong>{product.stock + (Number(addedAmount) || 0)} units</strong>
          </p>

          <div className="modal-actions">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Confirm Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
