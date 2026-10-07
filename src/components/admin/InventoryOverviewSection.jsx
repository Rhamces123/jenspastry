// ==========================================
// Jen's Pastry Shop - Admin Inventory Overview Section
// Visual split view of Raw Ingredients vs Finished Pastries
// ==========================================

import React from 'react';
import { Wheat, Package, ArrowRight, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

export default function InventoryOverviewSection({ 
  ingredients = [], 
  products = [], 
  productionRequests = [],
  onNavigateToTab 
}) {
  const getIngredientStatus = (ing) => {
    if (ing.disabled) return { label: 'Disabled', color: '#9CA3AF', bg: '#F3F4F6' };
    if (ing.quantity <= 0) return { label: 'Out of Stock', color: '#DC2626', bg: '#FEF2F2' };
    if (ing.quantity <= ing.minimumStock) return { label: 'Low Stock', color: '#DC2626', bg: '#FEF2F2' };
    if (ing.quantity <= ing.reorderLevel) return { label: 'Warning', color: '#D97706', bg: '#FEF3C7' };
    return { label: 'Good', color: '#16A34A', bg: '#F0FDF4' };
  };

  const getProductStockStatus = (prod) => {
    const minStock = prod.minimumStock || 20;
    if (prod.stock <= 0) return { label: 'Out of Stock', color: '#DC2626', bg: '#FEF2F2', isLow: true };
    if (prod.stock <= minStock) return { label: 'Low Stock', color: '#DC2626', bg: '#FEF2F2', isLow: true };
    if (prod.stock <= minStock * 1.5) return { label: 'Warning', color: '#D97706', bg: '#FEF3C7', isLow: false };
    return { label: 'Good', color: '#16A34A', bg: '#F0FDF4', isLow: false };
  };

  // Check active production request for a product
  const getActiveRequest = (prod) => {
    return productionRequests.find(r => 
      (r.productId === String(prod.id) || (r.productName && r.productName.toLowerCase() === prod.name.toLowerCase())) &&
      ['Pending', 'Accepted', 'Preparing', 'Ready for Cashier'].includes(r.status)
    );
  };

  return (
    <div className="admin-card" style={{ marginTop: '20px', marginBottom: '20px' }}>
      <div className="admin-card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🏪</span>
            Bakery Inventory Overview
          </h3>
          <p className="admin-card-subtitle">
            Synchronized live status of raw ingredients (Baker pantry) and finished pastries (Cashier shelf)
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        {/* PANEL 1: RAW INGREDIENTS */}
        <div style={{
          backgroundColor: '#FFF9FA',
          border: '1px solid #F9DAE7',
          borderRadius: '16px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F4BED5', pb: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wheat size={18} style={{ color: '#9D174D' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#9D174D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Raw Ingredients
              </h4>
            </div>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('ingredient-inventory')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9D174D',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Manage Pantry</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
            {ingredients.slice(0, 8).map(ing => {
              const status = getIngredientStatus(ing);
              return (
                <div
                  key={ing.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #F9DAE7',
                    borderRadius: '10px',
                    padding: '8px 12px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#1F242E', display: 'block' }}>
                      {ing.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#717A88' }}>
                      Min: {ing.minimumStock} {ing.unit} • {ing.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: '#1F242E', fontFamily: 'monospace' }}>
                      {ing.quantity} {ing.unit}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: status.color,
                      backgroundColor: status.bg,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{status.label === 'Good' ? '🟢' : status.label === 'Warning' ? '🟡' : '🔴'}</span>
                      <span>{status.label}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL 2: FINISHED PRODUCTS */}
        <div style={{
          backgroundColor: '#FAF5FF',
          border: '1px solid #E9D5FF',
          borderRadius: '16px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #D8B4FE', pb: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} style={{ color: '#7E22CE' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#7E22CE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Finished Pastries (Cashier Stock)
              </h4>
            </div>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('products')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7E22CE',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>View Pastries</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
            {products.slice(0, 8).map(prod => {
              const status = getProductStockStatus(prod);
              const activeReq = getActiveRequest(prod);

              return (
                <div
                  key={prod.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E9D5FF',
                    borderRadius: '10px',
                    padding: '8px 12px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#1F242E', display: 'block' }}>
                      {prod.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#717A88' }}>
                      Min: {prod.minimumStock || 20} pcs • Batch: {prod.productionBatchSize || 30} pcs
                    </span>
                    {activeReq && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#7E22CE',
                        backgroundColor: '#F3E8FF',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        marginTop: '2px'
                      }}>
                        <Flame size={10} />
                        Production: {activeReq.requestedQuantity} pcs ({activeReq.status})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: '#1F242E', fontFamily: 'monospace' }}>
                      {prod.stock} pcs
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: status.color,
                      backgroundColor: status.bg,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{status.label === 'Good' ? '🟢' : status.label === 'Warning' ? '🟡' : '🔴'}</span>
                      <span>{status.label}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
