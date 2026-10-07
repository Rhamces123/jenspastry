// ==========================================
// Jen's Pastry Shop - Admin Restock Ingredient Modal
// Section 4: Add Stock / Restock Ingredient
// ==========================================

import React, { useState } from 'react';
import { Plus, X, AlertCircle, Truck } from 'lucide-react';

export default function RestockIngredientModal({ isOpen, onClose, ingredient, onConfirm }) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('New Supplier Delivery');
  const [supplier, setSupplier] = useState(ingredient?.supplier || '');
  const [error, setError] = useState('');

  if (!isOpen || !ingredient) return null;

  const currentStock = Number(ingredient.quantity) || 0;
  const numAdded = Number(quantity) || 0;
  const projectedStock = Math.round((currentStock + numAdded) * 100) / 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (quantity === '' || isNaN(numAdded) || numAdded <= 0) {
      setError('Please enter a valid stock quantity to add greater than zero.');
      return;
    }

    try {
      onConfirm(ingredient.id, numAdded, reason, supplier);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to restock ingredient.');
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div 
        className="admin-modal-card" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        style={{ maxWidth: '440px' }}
      >
        <div className="admin-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={20} style={{ color: '#059669' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F242E' }}>
              Add Ingredient Stock (Restock)
            </h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-body">
          {error && (
            <div style={{
              padding: '10px 14px',
              background: '#FFF1F2',
              color: '#BE123C',
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid #FECDD3',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Current Stock Snapshot Card */}
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#047857', fontWeight: 800 }}>
                  Selected Ingredient
                </span>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#065F46' }}>
                  {ingredient.name}
                </h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: '#047857', fontWeight: 700, display: 'block' }}>Current Stock</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#065F46', fontFamily: 'monospace' }}>
                  {currentStock} {ingredient.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity to Add */}
          <div className="admin-form-group">
            <label className="admin-form-label">Quantity to Add ({ingredient.unit}) *</label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              autoFocus
              placeholder="e.g. 25"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="admin-form-input"
              style={{ fontSize: '15px', fontWeight: 700 }}
            />
          </div>

          {/* Reason */}
          <div className="admin-form-group">
            <label className="admin-form-label">Delivery / Intake Reason *</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="admin-form-select"
            >
              <option value="New Supplier Delivery">New Supplier Delivery</option>
              <option value="Pantry Restock">Pantry Restock / Top Up</option>
              <option value="Emergency Purchase">Emergency Local Market Purchase</option>
              <option value="Physical Inventory Count Adjustment">Physical Inventory Count Adjustment</option>
              <option value="Other">Other / Special Order</option>
            </select>
          </div>

          {/* Supplier */}
          <div className="admin-form-group">
            <label className="admin-form-label">Supplier / Order Reference</label>
            <input
              type="text"
              placeholder="e.g. Golden Wheat Milling (Inv #4092)"
              value={supplier}
              onChange={e => setSupplier(e.target.value)}
              className="admin-form-input"
            />
          </div>

          {/* Real-time Math Summary Card */}
          {numAdded > 0 && (
            <div style={{
              backgroundColor: '#FAF5FF',
              border: '1px solid #E9D5FF',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '12px',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B21A8' }}>
                <span>Previous Stock:</span>
                <span style={{ fontWeight: 700 }}>{currentStock} {ingredient.unit}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontWeight: 700 }}>
                <span>Added:</span>
                <span>+{numAdded} {ingredient.unit}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: '#1F242E',
                fontWeight: 800,
                borderTop: '1px solid #E9D5FF',
                marginTop: '6px',
                paddingTop: '6px',
                fontSize: '13px'
              }}>
                <span>New Stock Level:</span>
                <span style={{ color: '#7E22CE', fontFamily: 'monospace' }}>{projectedStock} {ingredient.unit}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn-admin-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-admin-primary"
            >
              <Plus size={14} />
              <span>Confirm Stock (+{numAdded || 0} {ingredient.unit})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
