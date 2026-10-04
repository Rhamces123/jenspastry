// ==========================================
// BAKEOLOGY - Thermal Receipt Modal
// Mobile receipt popup showing sale details
// ==========================================

import React from 'react';
import { formatCurrency, formatSaleNumber, formatDateTime } from '../utils/formatters.js';
import { CheckCircle, Printer } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, sale }) {
  if (!isOpen || !sale) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content receipt-modal-content"
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        <div className="receipt-paper">
          {/* Header */}
          <div className="receipt-header text-center">
            <div className="receipt-success-icon">
              <CheckCircle size={32} className="text-success inline" />
            </div>
            <h2 className="receipt-brand">BAKEOLOGY</h2>
            <p className="receipt-sub">Pastry Shop Management System</p>
            <p className="receipt-address">123 Bakery Lane, Sweet City</p>
            <div className="receipt-dashed-line"></div>
          </div>

          {/* Transaction Metadata */}
          <div className="receipt-meta space-y-1">
            <div className="flex justify-between">
              <span>Receipt No:</span>
              <strong className="font-mono">{formatSaleNumber(sale.saleNumber || sale.id)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDateTime(sale.date)}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-semibold">{sale.customerName || sale.customerType || 'Walk-in Guest'}</span>
            </div>
            {sale.paymentMethod && (
              <div className="flex justify-between">
                <span>Tender:</span>
                <span className="font-semibold">{sale.paymentMethod}</span>
              </div>
            )}
            <div className="receipt-dashed-line"></div>
          </div>

          {/* Items Table */}
          <div className="receipt-items">
            <div className="receipt-items-header flex justify-between font-bold text-xs">
              <span>ITEM</span>
              <span>QTY</span>
              <span>TOTAL</span>
            </div>
            <div className="receipt-items-body">
              {sale.items?.map((item, idx) => (
                <div key={idx} className="receipt-item-row flex justify-between text-xs py-1">
                  <span className="flex-1 truncate pr-2">{item.name}</span>
                  <span className="w-12 text-center">x{item.quantity}</span>
                  <span className="w-16 text-right">
                    {formatCurrency(item.lineTotal || (item.price * item.quantity))}
                  </span>
                </div>
              ))}
            </div>
            <div className="receipt-dashed-line"></div>
          </div>

          {/* Totals */}
          <div className="receipt-totals space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Discount ({Math.round((sale.discountRate || 0) * 100)}%):</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="receipt-dashed-line"></div>
            <div className="flex justify-between text-base font-bold text-primary">
              <span>FINAL TOTAL:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
            {sale.amountReceived > 0 && (
              <>
                <div className="flex justify-between text-xs text-muted pt-1">
                  <span>Cash Tendered:</span>
                  <span>{formatCurrency(sale.amountReceived)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-success">
                  <span>Change:</span>
                  <span>{formatCurrency(sale.change || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="receipt-footer text-center mt-4">
            <p className="text-xs text-muted">Thank you for visiting BAKEOLOGY!</p>
            <p className="text-xs text-muted">Freshly Baked Every Morning ❤️</p>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="receipt-actions flex gap-2 mt-4">
          <button
            type="button"
            className="btn-secondary flex-1 flex items-center justify-center gap-1"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
