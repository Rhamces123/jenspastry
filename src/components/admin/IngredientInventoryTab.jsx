// ==========================================
// Jen's Pastry Shop - Admin Dedicated Ingredient Inventory Page
// Section 2, 3, 4: Complete Ingredient Management & Restocking
// ==========================================

import React, { useState, useMemo } from 'react';
import { 
  Wheat, 
  Plus, 
  Search, 
  Truck, 
  Edit3, 
  EyeOff, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  History,
  Layers,
  Scale
} from 'lucide-react';
import { INGREDIENT_CATEGORIES } from './AddIngredientModal.jsx';

export default function IngredientInventoryTab({
  ingredients = [],
  onOpenAddModal,
  onOpenRestockModal,
  onOpenEditModal,
  onToggleDisable,
  onViewHistory
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'disabled'
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Key KPI stats
  const totalCount = ingredients.length;
  const inStockCount = ingredients.filter(i => !i.disabled && i.quantity > i.minimumStock).length;
  const lowStockCount = ingredients.filter(i => !i.disabled && i.quantity > 0 && i.quantity <= i.minimumStock).length;
  const outOfStockCount = ingredients.filter(i => !i.disabled && i.quantity <= 0).length;
  const disabledCount = ingredients.filter(i => i.disabled).length;

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      const matchesSearch = !searchQuery || 
        ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ing.supplier && ing.supplier.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === 'ALL' || ing.category === categoryFilter;

      let matchesStatus = true;
      if (statusFilter === 'in_stock') {
        matchesStatus = !ing.disabled && ing.quantity > ing.minimumStock;
      } else if (statusFilter === 'low_stock') {
        matchesStatus = !ing.disabled && ing.quantity > 0 && ing.quantity <= ing.minimumStock;
      } else if (statusFilter === 'out_of_stock') {
        matchesStatus = !ing.disabled && ing.quantity <= 0;
      } else if (statusFilter === 'disabled') {
        matchesStatus = ing.disabled;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [ingredients, searchQuery, statusFilter, categoryFilter]);

  const getStatusBadge = (ing) => {
    if (ing.disabled) {
      return (
        <span style={{
          backgroundColor: '#F3F4F6',
          color: '#6B7280',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ⚪ Disabled
        </span>
      );
    }
    if (ing.quantity <= 0) {
      return (
        <span style={{
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECDD3',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          🔴 Out of Stock
        </span>
      );
    }
    if (ing.quantity <= ing.minimumStock) {
      return (
        <span style={{
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECDD3',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          🔴 Low Stock
        </span>
      );
    }
    if (ing.quantity <= ing.reorderLevel) {
      return (
        <span style={{
          backgroundColor: '#FEF3C7',
          color: '#D97706',
          border: '1px solid #FDE68A',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          🟡 Warning
        </span>
      );
    }
    return (
      <span style={{
        backgroundColor: '#F0FDF4',
        color: '#16A34A',
        border: '1px solid #BBF7D0',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        🟢 In Stock
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Row */}
      <div className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="admin-kpi-card kpi-products">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Total Ingredients</span>
            <div className="admin-kpi-icon-wrap icon-products">
              <Wheat size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{totalCount}</div>
          <div className="admin-kpi-subtext">Pantry items tracked</div>
        </div>

        <div className="admin-kpi-card kpi-revenue">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">In Stock (Healthy)</span>
            <div className="admin-kpi-icon-wrap icon-revenue">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: '#16A34A' }}>{inStockCount}</div>
          <div className="admin-kpi-subtext">Above minimum stock</div>
        </div>

        <div className="admin-kpi-card kpi-lowstock">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Low Stock</span>
            <div className="admin-kpi-icon-wrap icon-lowstock">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: lowStockCount > 0 ? '#DC2626' : '#10B981' }}>
            {lowStockCount}
          </div>
          <div className="admin-kpi-subtext">At or below minimum level</div>
        </div>

        <div className="admin-kpi-card kpi-orders">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Out of Stock</span>
            <div className="admin-kpi-icon-wrap icon-orders">
              <XCircle size={18} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: outOfStockCount > 0 ? '#DC2626' : '#6B7280' }}>
            {outOfStockCount}
          </div>
          <div className="admin-kpi-subtext">Requires immediate delivery</div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="admin-card" style={{ padding: '16px 20px' }}>
        <div className="admin-filter-bar" style={{ margin: 0, justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
            {/* Search */}
            <div className="admin-search-wrap" style={{ minWidth: '220px' }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search ingredients or suppliers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="admin-form-select"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '12px' }}
            >
              <option value="ALL">All Categories</option>
              {INGREDIENT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Status Pills */}
            <div className="admin-pills-wrap">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'in_stock', label: '🟢 In Stock' },
                { id: 'low_stock', label: '🔴 Low Stock' },
                { id: 'out_of_stock', label: 'Out of Stock' },
                { id: 'disabled', label: 'Disabled' }
              ].map(pill => (
                <button
                  key={pill.id}
                  type="button"
                  className={`admin-pill ${statusFilter === pill.id ? 'active' : ''}`}
                  onClick={() => setStatusFilter(pill.id)}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action: Add Ingredient Button */}
          <button
            type="button"
            className="btn-admin-primary"
            onClick={onOpenAddModal}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Plus size={15} />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ingredient Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Minimum Stock</th>
              <th>Reorder Level</th>
              <th>Supplier</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px 16px', color: '#8A92A0' }}>
                  <Wheat size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                  <p style={{ fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>
                    No ingredients found
                  </p>
                  <p style={{ fontSize: '12px', color: '#8A92A0', margin: '0 0 14px' }}>
                    Try adjusting your filter or add a new ingredient to the bakery pantry.
                  </p>
                  <button
                    type="button"
                    className="btn-admin-primary"
                    onClick={onOpenAddModal}
                  >
                    <Plus size={14} />
                    <span>Add New Ingredient</span>
                  </button>
                </td>
              </tr>
            ) : (
              filteredIngredients.map(ing => (
                <tr key={ing.id} style={{ opacity: ing.disabled ? 0.65 : 1 }}>
                  <td>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#1F242E', display: 'block' }}>
                        {ing.name}
                      </span>
                      {ing.notes && (
                        <span style={{ fontSize: '10px', color: '#717A88' }}>{ing.notes}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: '#F4EFEB',
                      color: '#555E68',
                      fontWeight: 600,
                      fontSize: '11px'
                    }}>
                      {ing.category}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      color: ing.quantity <= ing.minimumStock ? '#DC2626' : '#1F242E'
                    }}>
                      {ing.quantity} {ing.unit}
                    </span>
                  </td>
                  <td style={{ color: '#555E68', fontSize: '12px' }}>
                    {ing.minimumStock} {ing.unit}
                  </td>
                  <td style={{ color: '#555E68', fontSize: '12px' }}>
                    {ing.reorderLevel} {ing.unit}
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: ing.supplier ? '#1F242E' : '#9CA3AF' }}>
                      {ing.supplier || 'N/A'}
                    </span>
                  </td>
                  <td>
                    {getStatusBadge(ing)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      {/* Add Stock / Restock */}
                      <button
                        type="button"
                        className="btn-admin-primary"
                        style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => onOpenRestockModal(ing)}
                        title="Add Stock / Record Delivery"
                      >
                        <Plus size={12} />
                        <span>Add Stock</span>
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        className="btn-admin-secondary"
                        style={{ padding: '5px 8px', fontSize: '11px' }}
                        onClick={() => onOpenEditModal(ing)}
                        title="Edit Ingredient"
                      >
                        <Edit3 size={13} />
                      </button>

                      {/* Disable / Enable Toggle */}
                      <button
                        type="button"
                        style={{
                          padding: '5px 8px',
                          fontSize: '11px',
                          background: ing.disabled ? '#ECFDF5' : '#F3F4F6',
                          color: ing.disabled ? '#047857' : '#6B7280',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => onToggleDisable(ing.id)}
                        title={ing.disabled ? 'Enable Ingredient' : 'Disable Ingredient'}
                      >
                        {ing.disabled ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
