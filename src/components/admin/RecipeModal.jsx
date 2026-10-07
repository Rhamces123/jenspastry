// ==========================================
// Jen's Pastry Shop - Admin Recipe Modal
// Section 8 & 9: Create and edit recipes for pastries
// ==========================================

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, X, AlertCircle, Sparkles, Calculator } from 'lucide-react';

export default function RecipeModal({ 
  isOpen, 
  onClose, 
  product, 
  existingRecipe, 
  availableIngredients = [], 
  onSaveRecipe 
}) {
  const [baseQuantity, setBaseQuantity] = useState(existingRecipe?.baseQuantity || 10);
  const [unit, setUnit] = useState(existingRecipe?.unit || 'pcs');
  const [instructions, setInstructions] = useState(existingRecipe?.instructions || '');
  const [recipeIngredients, setRecipeIngredients] = useState(() => {
    if (existingRecipe?.ingredients && existingRecipe.ingredients.length > 0) {
      return existingRecipe.ingredients.map(i => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unit: i.unit || 'kg'
      }));
    }
    return [
      { ingredientId: availableIngredients[0]?.id || 'ing-flour', quantity: 1, unit: availableIngredients[0]?.unit || 'kg' }
    ];
  });
  const [error, setError] = useState('');
  const [previewMultiplier, setPreviewMultiplier] = useState(30);

  useEffect(() => {
    if (existingRecipe) {
      setBaseQuantity(existingRecipe.baseQuantity || 10);
      setUnit(existingRecipe.unit || 'pcs');
      setInstructions(existingRecipe.instructions || '');
      setRecipeIngredients(existingRecipe.ingredients.map(i => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        unit: i.unit || 'kg'
      })));
    } else {
      setBaseQuantity(10);
      setUnit('pcs');
      setInstructions('');
      setRecipeIngredients([
        { ingredientId: availableIngredients[0]?.id || 'ing-flour', quantity: 1, unit: availableIngredients[0]?.unit || 'kg' }
      ]);
    }
  }, [existingRecipe, availableIngredients]);

  if (!isOpen || !product) return null;

  const handleAddIngredientRow = () => {
    const firstAvailable = availableIngredients[0];
    setRecipeIngredients(prev => [
      ...prev,
      {
        ingredientId: firstAvailable ? firstAvailable.id : '',
        quantity: 0.5,
        unit: firstAvailable ? firstAvailable.unit : 'kg'
      }
    ]);
  };

  const handleRemoveIngredientRow = (idx) => {
    setRecipeIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx, field, value) => {
    setRecipeIngredients(prev => prev.map((item, i) => {
      if (i === idx) {
        if (field === 'ingredientId') {
          const matched = availableIngredients.find(ai => ai.id === value);
          return {
            ...item,
            ingredientId: value,
            unit: matched ? matched.unit : item.unit
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const numBase = Number(baseQuantity);
    if (isNaN(numBase) || numBase <= 0) {
      setError('Base production quantity must be greater than zero.');
      return;
    }

    if (recipeIngredients.length === 0) {
      setError('Recipe must include at least one ingredient.');
      return;
    }

    for (const ing of recipeIngredients) {
      if (!ing.ingredientId) {
        setError('Please select an ingredient for every row.');
        return;
      }
      if (Number(ing.quantity) <= 0 || isNaN(Number(ing.quantity))) {
        setError('Ingredient quantity must be greater than zero.');
        return;
      }
    }

    try {
      const enrichedIngredients = recipeIngredients.map(item => {
        const matched = availableIngredients.find(ai => ai.id === item.ingredientId);
        return {
          ingredientId: item.ingredientId,
          ingredientName: matched ? matched.name : 'Ingredient',
          quantity: Number(item.quantity),
          unit: item.unit || (matched ? matched.unit : 'kg')
        };
      });

      onSaveRecipe({
        id: existingRecipe?.id,
        productId: String(product.id),
        productName: product.name,
        baseQuantity: numBase,
        unit,
        instructions: instructions.trim(),
        ingredients: enrichedIngredients
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save recipe.');
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div 
        className="admin-modal-card" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        style={{ maxWidth: '640px' }}
      >
        <div className="admin-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} style={{ color: '#9D174D' }} />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F242E' }}>
                Recipe Formulation: {product.name}
              </h3>
              <span style={{ fontSize: '11px', color: '#717A88' }}>
                Defines raw ingredient consumption rates for automated bakery production
              </span>
            </div>
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

          {/* Base Production Yield */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '12px',
            backgroundColor: '#FFF9FA',
            border: '1px solid #F9DAE7',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '14px'
          }}>
            <div className="admin-form-group" style={{ margin: 0 }}>
              <label className="admin-form-label">Base Production Yield *</label>
              <input
                type="number"
                min="1"
                required
                value={baseQuantity}
                onChange={e => setBaseQuantity(e.target.value)}
                className="admin-form-input"
                style={{ fontWeight: 800 }}
              />
              <span style={{ fontSize: '10px', color: '#9D174D', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                Ingredient quantities below are required to produce exactly this amount
              </span>
            </div>

            <div className="admin-form-group" style={{ margin: 0 }}>
              <label className="admin-form-label">Output Unit *</label>
              <input
                type="text"
                required
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="admin-form-input"
              />
            </div>
          </div>

          {/* Ingredients Breakdown Table */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="admin-form-label" style={{ margin: 0 }}>
                Required Raw Ingredients ({recipeIngredients.length})
              </label>
              <button
                type="button"
                className="btn-admin-secondary"
                style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleAddIngredientRow}
              >
                <Plus size={12} />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {recipeIngredients.map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1.5fr 1fr auto',
                    gap: '8px',
                    alignItems: 'center',
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '6px 10px'
                  }}
                >
                  <select
                    value={item.ingredientId}
                    onChange={e => handleIngredientChange(idx, 'ingredientId', e.target.value)}
                    className="admin-form-select"
                    style={{ fontSize: '12px', padding: '6px' }}
                  >
                    {availableIngredients.map(ai => (
                      <option key={ai.id} value={ai.id}>
                        {ai.name} ({ai.unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => handleIngredientChange(idx, 'quantity', e.target.value)}
                    className="admin-form-input"
                    style={{ fontSize: '12px', padding: '6px', textAlign: 'right' }}
                  />

                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563', paddingLeft: '4px' }}>
                    {item.unit}
                  </span>

                  <button
                    type="button"
                    disabled={recipeIngredients.length <= 1}
                    onClick={() => handleRemoveIngredientRow(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: recipeIngredients.length <= 1 ? '#D1D5DB' : '#DC2626',
                      cursor: recipeIngredients.length <= 1 ? 'not-allowed' : 'pointer',
                      padding: '4px'
                    }}
                    title="Remove ingredient"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Formula Scaling Preview Callout */}
          <div style={{
            backgroundColor: '#FAF5FF',
            border: '1px solid #E9D5FF',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '14px',
            fontSize: '11px',
            color: '#6B21A8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calculator size={13} />
                Live Scaling Simulation:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Produce:</span>
                <input
                  type="number"
                  min="1"
                  value={previewMultiplier}
                  onChange={e => setPreviewMultiplier(Number(e.target.value) || 1)}
                  style={{ width: '50px', padding: '1px 4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #D8B4FE', textAlign: 'center', fontWeight: 800 }}
                />
                <span>{unit}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {recipeIngredients.map((ing, i) => {
                const matched = availableIngredients.find(ai => ai.id === ing.ingredientId);
                const base = Number(baseQuantity) || 1;
                const scaled = Math.round(((Number(ing.quantity) * previewMultiplier) / base) * 1000) / 1000;
                return (
                  <span key={i} style={{ backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E9D5FF', fontWeight: 600 }}>
                    {matched?.name || 'Ing'}: <strong>{scaled} {ing.unit}</strong>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Baking Instructions */}
          <div className="admin-form-group">
            <label className="admin-form-label">Preparation & Baking Instructions (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Knead dough, let rise for 1 hr, bake at 180°C for 15 minutes."
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="admin-form-input"
              style={{ fontSize: '12px' }}
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
              Save Recipe Formulation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
