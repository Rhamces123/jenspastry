// ==========================================
// Jen's Pastry Shop - Admin Production Management Tab
// Section 6, 7, 12, 19: View production requests, batches & ingredient deductions
// ==========================================

import React, { useState, useMemo } from 'react';
import { 
  ChefHat, 
  Flame, 
  CheckCircle, 
  Clock, 
  Plus, 
  Search, 
  Layers, 
  AlertTriangle,
  PackageCheck,
  Wheat,
  X
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/formatters.js';

export default function ProductionManagementTab({
  productionRequests = [],
  productionBatches = [],
  products = [],
  onRequestProduction
}) {
  const [activeSubTab, setActiveSubTab] = useState('requests'); // 'requests' | 'batches'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual request modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [requestedQty, setRequestedQty] = useState(30);
  const [priority, setPriority] = useState('High');
  const [notes, setNotes] = useState('');

  const filteredRequests = useMemo(() => {
    return productionRequests.filter(req => {
      const matchesSearch = !searchQuery ||
        req.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [productionRequests, searchQuery, statusFilter]);

  const filteredBatches = useMemo(() => {
    return productionBatches.filter(b => {
      const matchesSearch = !searchQuery ||
        b.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.producedBy && b.producedBy.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [productionBatches, searchQuery, statusFilter]);

  const handleCreateManualRequest = (e) => {
    e.preventDefault();
    const prod = products.find(p => String(p.id) === String(selectedProductId));
    if (!prod) return;

    onRequestProduction({
      productId: prod.id,
      productName: prod.name,
      requestedQuantity: Number(requestedQty) || 30,
      priority,
      currentStock: prod.stock || 0,
      minimumStock: prod.minimumStock || 20,
      triggeredBy: 'Store Owner / Admin',
      notes: notes.trim() || 'Manual production request initiated by Admin'
    });

    setIsManualModalOpen(false);
    setNotes('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
            🟡 Pending
          </span>
        );
      case 'Accepted':
      case 'Preparing':
        return (
          <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
            🔵 Preparing
          </span>
        );
      case 'Ready for Cashier':
        return (
          <span style={{ backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
            🟢 Ready for Cashier
          </span>
        );
      case 'Received':
        return (
          <span style={{ backgroundColor: '#F3E8FF', color: '#7E22CE', border: '1px solid #E9D5FF', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
            ✓ Received by Cashier
          </span>
        );
      default:
        return (
          <span style={{ backgroundColor: '#F3F4F6', color: '#4B5563', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Row */}
      <div className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="admin-kpi-card kpi-orders">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Active Requests</span>
            <div className="admin-kpi-icon-wrap icon-orders">
              <Clock size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">
            {productionRequests.filter(r => ['Pending', 'Accepted', 'Preparing'].includes(r.status)).length}
          </div>
          <div className="admin-kpi-subtext">Awaiting kitchen completion</div>
        </div>

        <div className="admin-kpi-card kpi-lowstock">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Ready for Cashier</span>
            <div className="admin-kpi-icon-wrap icon-lowstock">
              <PackageCheck size={18} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: '#16A34A' }}>
            {productionBatches.filter(b => b.status === 'Ready for Cashier').length}
          </div>
          <div className="admin-kpi-subtext">Baked, waiting cashier intake</div>
        </div>

        <div className="admin-kpi-card kpi-products">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Total Batches Produced</span>
            <div className="admin-kpi-icon-wrap icon-products">
              <Flame size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{productionBatches.length}</div>
          <div className="admin-kpi-subtext">Oven runs completed</div>
        </div>
      </div>

      {/* Subtab Toggle Bar */}
      <div className="admin-card" style={{ padding: '16px 20px' }}>
        <div className="admin-filter-bar" style={{ margin: 0, justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="admin-timeframe-switch">
              <button
                type="button"
                className={`timeframe-btn ${activeSubTab === 'requests' ? 'active' : ''}`}
                onClick={() => { setActiveSubTab('requests'); setStatusFilter('ALL'); }}
              >
                Production Requests ({productionRequests.length})
              </button>
              <button
                type="button"
                className={`timeframe-btn ${activeSubTab === 'batches' ? 'active' : ''}`}
                onClick={() => { setActiveSubTab('batches'); setStatusFilter('ALL'); }}
              >
                Completed Batches ({productionBatches.length})
              </button>
            </div>

            {/* Search */}
            <div className="admin-search-wrap" style={{ minWidth: '180px' }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search pastry or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
            </div>

            {/* Status Pills */}
            <div className="admin-pills-wrap">
              {(activeSubTab === 'requests' ? ['ALL', 'Pending', 'Preparing', 'Ready for Cashier', 'Received'] : ['ALL', 'Ready for Cashier', 'Received']).map(st => (
                <button
                  key={st}
                  type="button"
                  className={`admin-pill ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn-admin-primary"
            onClick={() => setIsManualModalOpen(true)}
          >
            <Plus size={15} />
            <span>Request Production</span>
          </button>
        </div>
      </div>

      {/* TABLE 1: PRODUCTION REQUESTS */}
      {activeSubTab === 'requests' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Pastry Product</th>
                <th>Requested Qty</th>
                <th>Current Stock</th>
                <th>Priority</th>
                <th>Triggered By</th>
                <th>Status</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px 16px', color: '#8A92A0' }}>
                    <ChefHat size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                    <p style={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>No production requests found</p>
                    <p style={{ fontSize: '12px', color: '#8A92A0' }}>When cashier pastry stock reaches minimum levels, requests will appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#9D174D' }}>
                      {req.id}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#1F242E', fontSize: '13px' }}>{req.productName}</span>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '13px', color: '#1F242E' }}>
                      {req.requestedQuantity} pcs
                    </td>
                    <td style={{ color: req.currentStock <= req.minimumStock ? '#DC2626' : '#1F242E', fontWeight: 600 }}>
                      {req.currentStock} pcs <span style={{ fontSize: '10px', color: '#8A92A0' }}>(Min: {req.minimumStock})</span>
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: req.priority === 'Urgent' ? '#FEE2E2' : req.priority === 'High' ? '#FEF3C7' : '#EFF6FF',
                        color: req.priority === 'Urgent' ? '#DC2626' : req.priority === 'High' ? '#B45309' : '#1D4ED8'
                      }}>
                        {req.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: '#717A88' }}>
                      {req.triggeredBy || 'Low Stock'}
                    </td>
                    <td>
                      {getStatusBadge(req.status)}
                    </td>
                    <td style={{ fontSize: '11px', color: '#8A92A0' }}>
                      {formatDateTime(req.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLE 2: COMPLETED PRODUCTION BATCHES */}
      {activeSubTab === 'batches' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Batch #</th>
                <th>Product Produced</th>
                <th>Quantity</th>
                <th>Ingredients Consumed</th>
                <th>Baker</th>
                <th>Completed At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 16px', color: '#8A92A0' }}>
                    <Layers size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                    <p style={{ fontWeight: 700, fontSize: '14px', color: '#374151' }}>No production batches completed yet</p>
                    <p style={{ fontSize: '12px', color: '#8A92A0' }}>Batches completed by the Baker will appear here with ingredient deductions.</p>
                  </td>
                </tr>
              ) : (
                filteredBatches.map(batch => (
                  <tr key={batch.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#9D174D' }}>
                      #{batch.batchNumber}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#1F242E', fontSize: '13px' }}>{batch.productName}</span>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '14px', color: '#1F242E' }}>
                      {batch.quantity} pcs
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '320px' }}>
                        {(batch.ingredientsUsed || []).map((ing, i) => (
                          <span 
                            key={i} 
                            style={{
                              backgroundColor: '#FFF1F2',
                              color: '#9D174D',
                              border: '1px solid #FECDD3',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontWeight: 600
                            }}
                          >
                            {ing.name}: {ing.quantity} {ing.unit}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#1F242E', fontSize: '12px' }}>
                      {batch.producedBy || 'Master Baker'}
                    </td>
                    <td style={{ fontSize: '11px', color: '#8A92A0' }}>
                      {formatDateTime(batch.completedAt)}
                    </td>
                    <td>
                      {getStatusBadge(batch.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MANUAL PRODUCTION REQUEST MODAL */}
      {isManualModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsManualModalOpen(false)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()}
            role="dialog"
            style={{ maxWidth: '440px' }}
          >
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} style={{ color: '#D97706' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F242E' }}>
                  Dispatch Production Request to Kitchen
                </h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setIsManualModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualRequest} className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Pastry Product *</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="admin-form-select"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Requested Quantity (pcs) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={requestedQty}
                    onChange={e => setRequestedQty(e.target.value)}
                    className="admin-form-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Priority *</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="admin-form-select"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent (Out of Stock)</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Kitchen Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Expected morning rush demand"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="admin-form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-admin-secondary"
                  onClick={() => setIsManualModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-admin-primary"
                >
                  <ChefHat size={14} />
                  <span>Send to Baker</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
