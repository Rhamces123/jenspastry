// ==========================================
// Jen's Pastry Shop - Admin Edit Ingredient Modal
// Edit details, reorder levels, supplier, and disable/enable
// ==========================================

import React, { useState } from 'react';
import { Edit3, X, AlertCircle } from 'lucide-react';
import { INGREDIENT_CATEGORIES, INGREDIENT_UNITS } from './AddIngredientModal.jsx';

export default function EditIngredientModal({ isOpen, onClose, ingredient, onSave }) {
  const [name, setName] = useState(ingredient?.name || '');
  const [category, setCategory] = useState(ingredient?.category || 'Flour & Grains');
  const [unit, setUnit] = useState(ingredient?.unit || 'kg');
  const [minimumStock, setMinimumStock] = useState(String(ingredient?.minimumStock || 10));
  const [reorderLevel, setReorderLevel] = useState(String(ingredient?.reorderLevel || 15));
  const [supplier, setSupplier] = useState(ingredient?.supplier || '');
  const [notes, setNotes] = useState(ingredient?.notes || '');
  const [disabled, setDisabled] = useState(Boolean(ingredient?.disabled));
  const [error, setError] = useState('');

  if (!isOpen || !ingredient) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Ingredient name is required.');
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
      onSave(ingredient.id, {
        name: name.trim(),
        category,
        unit,
        minimumStock: numMin,
        reorderLevel: numReorder,
        supplier: supplier.trim(),
        notes: notes.trim(),
        disabled
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update ingredient.');
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div 
        className="admin-modal-card" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        style={{ maxWidth: '500px' }}
      >
        <div className="admin-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={18} style={{ color: '#9D174D' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F242E' }}>
              Edit Ingredient: {ingredient.name}
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

          <div className="admin-form-group">
            <label className="admin-form-label">Ingredient Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="admin-form-input"
            />
          </div>

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
              <label className="admin-form-label">Unit *</label>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Minimum Stock Level *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={minimumStock}
                onChange={e => setMinimumStock(e.target.value)}
                className="admin-form-input"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Reorder Level *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={reorderLevel}
                onChange={e => setReorderLevel(e.target.value)}
                className="admin-form-input"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Supplier Information</label>
            <input
              type="text"
              value={supplier}
              onChange={e => setSupplier(e.target.value)}
              className="admin-form-input"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="admin-form-input"
            />
          </div>

          {/* Disable Ingredient Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#F9FAFB',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            marginTop: '8px'
          }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F242E', display: 'block' }}>
                Disable Ingredient
              </span>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>
                Mark inactive if this raw material is no longer used by the kitchen
              </span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={disabled}
                onChange={e => setDisabled(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#9D174D' }}
              />
            </label>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
