// ==========================================
// Jen's Pastry Shop - Admin Add Ingredient Modal
// Section 3: Add Ingredient Form
// ==========================================

import React, { useState } from 'react';
import { Wheat, PlusCircle, X, AlertCircle } from 'lucide-react';

export const INGREDIENT_CATEGORIES = [
  'Flour & Grains',
  'Sweeteners & Flavors',
  'Dairy & Eggs',
  'Leavening & Yeast',
  'Fats & Oils',
  'Fruits & Fillings',
  'Spices & Seasonings',
  'Baking Ingredient'
];

export const INGREDIENT_UNITS = ['kg', 'g', 'L', 'ml', 'pcs'];

export default function AddIngredientModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Flour & Grains');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [minimumStock, setMinimumStock] = useState('10');
  const [reorderLevel, setReorderLevel] = useState('15');
  const [supplier, setSupplier] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Ingredient name is required.');
      return;
    }

    const numQty = Number(quantity);
    if (quantity === '' || isNaN(numQty) || numQty < 0) {
      setError('Please provide a valid non-negative initial quantity.');
      return;
    }

    const numMin = Number(minimumStock);
    if (minimumStock === '' || isNaN(numMin) || numMin < 0) {
      setError('Minimum stock must be a non-negative number.');
      return;
    }

    const numReorder = Number(reorderLevel);
    if (reorderLevel === '' || isNaN(numReorder) || numReorder < 0) {
      setError('Reorder level must be a non-negative number.');
      return;
    }

    try {
      onSave({
        name: name.trim(),
        category,
        quantity: numQty,
        unit,
        minimumStock: numMin,
        reorderLevel: numReorder,
        supplier: supplier.trim(),
        expirationDate,
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save ingredient.');
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div 
        className="admin-modal-card" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        style={{ maxWidth: '520px' }}
      >
        <div className="admin-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wheat size={20} style={{ color: '#9D174D' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F242E' }}>
              Add New Bakery Ingredient
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

          {/* Ingredient Name */}
          <div className="admin-form-group">
            <label className="admin-form-label">Ingredient Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Flour, Granulated Sugar, Butter"
              value={name}
              onChange={e => setName(e.target.value)}
              className="admin-form-input"
              autoFocus
            />
          </div>

          {/* Category & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="admin-form-select"
              >
                {INGREDIENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Unit of Measure *</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="admin-form-select"
              >
                {INGREDIENT_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Quantity, Minimum Stock & Reorder Level */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Initial Qty ({unit}) *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="50"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="admin-form-input"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Min Stock ({unit}) *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="10"
                value={minimumStock}
                onChange={e => setMinimumStock(e.target.value)}
                className="admin-form-input"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Reorder Lvl ({unit}) *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="15"
                value={reorderLevel}
                onChange={e => setReorderLevel(e.target.value)}
                className="admin-form-input"
              />
            </div>
          </div>

          {/* Supplier & Expiration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Supplier (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Golden Wheat Milling"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="admin-form-input"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Expiration Date (Optional)</label>
              <input
                type="date"
                value={expirationDate}
                onChange={e => setExpirationDate(e.target.value)}
                className="admin-form-input"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="admin-form-group">
            <label className="admin-form-label">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Keep stored in dry pantry container"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="admin-form-input"
            />
          </div>

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
              <PlusCircle size={14} />
              <span>Save Ingredient</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
