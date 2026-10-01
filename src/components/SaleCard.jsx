// ==========================================
// Jen's Pastry Shop - Sale Card
// Mobile card displaying a past transaction
// ==========================================

import React, { useState } from 'react';
import { formatCurrency, formatSaleNumber, formatDateTime } from '../utils/formatters.js';
import { Receipt, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';

export default function SaleCard({ sale, onViewReceipt }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mobile-card sale-card">
      <div className="sale-card-header">
        <div className="sale-title-group">
          <div className="sale-badge-icon">
            <Receipt size={16} />
          </div>
          <div>
            <h4 className="sale-id">{formatSaleNumber(sale.saleNumber || sale.id)}</h4>
            <span className="sale-date">{formatDateTime(sale.date)}</span>
          </div>
        </div>

        <div className="sale-customer-badge">
          <UserCheck size={12} className="inline mr-1" />
          <span>{sale.customerType}</span>
        </div>
      </div>

      {/* Primary Financial Summary */}
      <div className="sale-summary-grid">
        <div className="sale-summary-row">
          <span className="sale-label">Subtotal:</span>
          <span className="sale-val">{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="sale-summary-row text-success">
            <span className="sale-label">
              Discount {sale.discountRate ? `(${Math.round(sale.discountRate * 100)}%)` : ''}:
            </span>
            <span className="sale-val">-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="sale-summary-row sale-total-row">
          <span className="sale-label-total">Total:</span>
          <span className="sale-val-total">{formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Expandable Purchased Items breakdown */}
      {sale.items && sale.items.length > 0 && (
        <div className="sale-items-container">
          <button
            type="button"
            className="toggle-items-btn"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            <span>{sale.items.length} item{sale.items.length > 1 ? 's' : ''} purchased</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expanded && (
            <div className="sale-items-list">
              {sale.items.map((item, index) => (
                <div key={index} className="sale-item-row">
                  <span className="sale-item-name">
                    {item.name} <span className="text-muted">× {item.quantity}</span>
                  </span>
                  <span className="sale-item-price">
                    {formatCurrency(item.lineTotal || (item.price * item.quantity))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {onViewReceipt && (
        <div className="sale-card-footer">
          <button
            type="button"
            className="btn-action-outline w-full"
            onClick={() => onViewReceipt(sale)}
          >
            <Receipt size={14} /> View Receipt
          </button>
        </div>
      )}
    </div>
  );
}
