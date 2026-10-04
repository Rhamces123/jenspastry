// ==========================================
// Jen's Pastry Shop - Product Form Modal
// Mobile-friendly Add & Edit product modal with validation
// ==========================================

import React, { useState } from 'react';
import { PRODUCT_CATEGORIES } from '../patterns/PastryProductFactory.js';
import { PlusCircle, Save, X, AlertCircle } from 'lucide-react';

export default function ProductFormModal({ isOpen, onClose, onSubmit, initialProduct = null }) {
  // VARIABLES: Form state initialized from initialProduct if present
  const [name, setName] = useState(initialProduct ? (initialProduct.name || '') : '');
  const [category, setCategory] = useState(initialProduct ? (initialProduct.category || 'Bread') : 'Bread');
  const [price, setPrice] = useState(initialProduct && initialProduct.price !== undefined ? String(initialProduct.price) : '');
  const [stock, setStock] = useState(initialProduct && initialProduct.stock !== undefined ? String(initialProduct.stock) : '');
  const [imageUrl, setImageUrl] = useState(initialProduct ? (initialProduct.imageUrl || '') : '');
  const [errors, setErrors] = useState({});

  const isEditing = Boolean(initialProduct);

  if (!isOpen) return null;

  // FUNCTIONS: Validation
  const validateForm = () => {
    const newErrors = {};

    if (!name || name.trim().length === 0) {
      newErrors.name = 'Product name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    const numPrice = Number(price);
    if (price === '' || isNaN(numPrice)) {
      newErrors.price = 'Valid price is required';
    } else if (numPrice < 1) {
      newErrors.price = 'Price must be at least ₱1';
    }

    const numStock = Number(stock);
    if (stock === '' || isNaN(numStock)) {
      newErrors.stock = 'Valid stock count is required';
    } else if (numStock < 0 || !Number.isInteger(numStock)) {
      newErrors.stock = 'Stock must be a whole positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // FACTORY PATTERN
    // Creates pastry product objects in one centralized place.
    // The data is dispatched to the ShopManager which calls PastryProductFactory.
    const productPayload = {
      name: name.trim(),
      category: category,
      price: Number(price),
      stock: Number(stock),
      imageUrl: imageUrl.trim() || undefined
    };

    onSubmit(productPayload);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content mobile-card" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            {isEditing ? <Save size={20} className="text-primary" /> : <PlusCircle size={20} className="text-primary" />}
            <h2 id="modal-title" className="modal-title">
              {isEditing ? 'Edit Pastry Product' : 'Add New Pastry Product'}
            </h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form space-y-4">
          {/* Product Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="prod-name">Product Name *</label>
            <input
              id="prod-name"
              type="text"
              className={`form-input ${errors.name ? 'form-input-error' : ''}`}
              placeholder="e.g. Pandesal, Ensaymada"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {errors.name && (
              <span className="form-error"><AlertCircle size={14} /> {errors.name}</span>
            )}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="prod-category">Category *</label>
            <select
              id="prod-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {PRODUCT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'Bread' && '🥖 '}
                  {cat === 'Pastry' && '🥐 '}
                  {cat === 'Cake' && '🎂 '}
                  {cat === 'Dessert' && '🍮 '}
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price & Stock Grid */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="prod-price">Price (₱) *</label>
              <div className="input-prefix-wrapper">
                <span className="input-prefix">₱</span>
                <input
                  id="prod-price"
                  type="number"
                  step="any"
                  min="0"
                  className={`form-input pl-7 ${errors.price ? 'form-input-error' : ''}`}
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              {errors.price && (
                <span className="form-error"><AlertCircle size={14} /> {errors.price}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-stock">Initial Stock *</label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                step="1"
                className={`form-input ${errors.stock ? 'form-input-error' : ''}`}
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
              {errors.stock && (
                <span className="form-error"><AlertCircle size={14} /> {errors.stock}</span>
              )}
            </div>
          </div>

          {/* Image URL / Picture */}
          <div className="form-group">
            <label className="form-label" htmlFor="prod-image">Image URL or Path</label>
            <input
              id="prod-image"
              type="text"
              className="form-input"
              placeholder="e.g. /products/bread.svg or https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <div className="mt-2 p-2 bg-cream-pure rounded-lg border border-border-light flex items-center gap-2.5">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-10 h-10 object-contain rounded-md border border-border-light bg-white"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="text-2xs text-muted">Image preview</span>
              </div>
            )}
          </div>

          <div className="pattern-note">
            <small>
              💡 <strong>Factory Pattern Notice:</strong> Submitting will pass this payload to <code>PastryProductFactory.createProduct()</code> to produce a standardized, typed pastry object.
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {isEditing ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
