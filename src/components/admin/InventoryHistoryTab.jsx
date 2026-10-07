import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Wheat, 
  ShoppingBag, 
  Calendar, 
  User, 
  FileText,
  Clock
} from 'lucide-react';
import { useBakeryWorkflow } from '../../hooks/useBakeryWorkflow.js';
import { formatDateTime } from '../../utils/formatters.js';

export default function InventoryHistoryTab() {
  const { transactions } = useBakeryWorkflow();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all'); // all, ingredient, product
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Category filter
      if (selectedCategory !== 'all') {
        const itemType = tx.itemType || (tx.type?.includes('ingredient') ? 'ingredient' : 'product');
        if (selectedCategory === 'ingredient' && itemType !== 'ingredient') return false;
        if (selectedCategory === 'product' && itemType !== 'product') return false;
      }

      // Transaction Type filter
      if (selectedType !== 'all') {
        if (selectedType === 'restock' && !tx.type?.includes('restock')) return false;
        if (selectedType === 'production' && !tx.type?.includes('production')) return false;
        if (selectedType === 'received' && !tx.type?.includes('received')) return false;
        if (selectedType === 'sale' && !tx.type?.includes('sale')) return false;
        if (selectedType === 'adjustment' && !tx.type?.includes('adjustment')) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const itemName = (tx.itemName || tx.productName || tx.ingredientName || '').toLowerCase();
        const reason = (tx.reason || tx.notes || '').toLowerCase();
        const performedBy = (tx.performedByName || tx.performedBy || '').toLowerCase();
        const refId = (tx.referenceId || tx.batchId || tx.id || '').toLowerCase();
        if (!itemName.includes(q) && !reason.includes(q) && !performedBy.includes(q) && !refId.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedCategory, selectedType, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Stat summary counters
  const stats = useMemo(() => {
    let ingredientOps = 0;
    let pastryOps = 0;
    let totalDeductions = 0;
    let totalAdditions = 0;

    transactions.forEach(tx => {
      const isIng = tx.itemType === 'ingredient' || tx.type?.includes('ingredient');
      if (isIng) ingredientOps++;
      else pastryOps++;

      if (tx.quantityChange > 0) totalAdditions++;
      else if (tx.quantityChange < 0) totalDeductions++;
    });

    return {
      total: transactions.length,
      ingredientOps,
      pastryOps,
      totalAdditions,
      totalDeductions
    };
  }, [transactions]);

  // Format badge helper
  const getTypeBadge = (type) => {
    switch (type) {
      case 'ingredient_restock':
      case 'stock_added':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Restock / Delivery</span>;
      case 'ingredient_deduction':
      case 'production_deduction':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><ArrowUpRight className="w-3 h-3 text-amber-600" /> Baker Consumed</span>;
      case 'production_finished':
      case 'production_completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800"><Wheat className="w-3 h-3 text-purple-600" /> Production Output</span>;
      case 'production_received':
      case 'stock_received':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><ShoppingBag className="w-3 h-3 text-blue-600" /> Cashier Received</span>;
      case 'sale_deduction':
      case 'customer_sale':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><ArrowUpRight className="w-3 h-3 text-rose-600" /> POS Sale</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{type?.replace(/_/g, ' ') || 'Transaction'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <History className="w-7 h-7 text-[#D81B60]" />
            Complete Inventory & Stock History
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time immutable audit trail of raw ingredient movements, baker consumption, production yields, cashier receipts, and customer sales.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Operations</span>
            <History className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{stats.total}</p>
          <p className="text-xs text-gray-400 mt-0.5">Audited stock movements</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient Logs</span>
            <Wheat className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{stats.ingredientOps}</p>
          <p className="text-xs text-gray-400 mt-0.5">Restocks & deductions</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pastry Logs</span>
            <ShoppingBag className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{stats.pastryOps}</p>
          <p className="text-xs text-gray-400 mt-0.5">Outputs, receives & sales</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Additions</span>
            <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{stats.totalAdditions}</p>
          <p className="text-xs text-gray-400 mt-0.5">Inflow transactions</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search by ingredient, pastry name, reference ID, reason, or user..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D81B60]/20 focus:border-[#D81B60]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Inventory Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:border-[#D81B60]"
          >
            <option value="all">All Categories</option>
            <option value="ingredient">🌾 Raw Ingredients Only</option>
            <option value="product">🥐 Finished Pastries Only</option>
          </select>

          {/* Operation type filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:border-[#D81B60]"
          >
            <option value="all">All Operation Types</option>
            <option value="restock">📦 Supplier Restocks</option>
            <option value="production">👩‍🍳 Baker Production / Used</option>
            <option value="received">📥 Cashier Received</option>
            <option value="sale">💰 POS Sales</option>
            <option value="adjustment">⚙️ Adjustments</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Operation Type</th>
                <th className="py-3 px-4">Inventory Category</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4 text-center">Change</th>
                <th className="py-3 px-4 text-right">Previous → New Stock</th>
                <th className="py-3 px-4">Reason / Reference</th>
                <th className="py-3 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    No inventory transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isPositive = Number(tx.quantityChange) > 0;
                  const isNegative = Number(tx.quantityChange) < 0;
                  const isIngredient = tx.itemType === 'ingredient' || tx.type?.includes('ingredient');
                  const unit = tx.unit || (isIngredient ? 'kg' : 'pcs');

                  return (
                    <tr key={tx.id || `${tx.timestamp}-${Math.random()}`} className="hover:bg-gray-50/60 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDateTime(tx.timestamp || tx.createdAt)}</span>
                        </div>
                      </td>

                      {/* Operation Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getTypeBadge(tx.type)}
                      </td>

                      {/* Inventory Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isIngredient ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Wheat className="w-3 h-3 text-amber-600" /> Raw Ingredient
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <ShoppingBag className="w-3 h-3 text-rose-600" /> Finished Pastry
                          </span>
                        )}
                      </td>

                      {/* Item Name */}
                      <td className="py-3.5 px-4 font-semibold text-gray-800">
                        {tx.itemName || tx.productName || tx.ingredientName || 'Unnamed Item'}
                      </td>

                      {/* Change */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block font-bold text-sm px-2 py-0.5 rounded ${
                          isPositive 
                            ? 'bg-emerald-50 text-emerald-700 font-mono' 
                            : isNegative 
                            ? 'bg-rose-50 text-rose-700 font-mono' 
                            : 'bg-gray-100 text-gray-600 font-mono'
                        }`}>
                          {isPositive ? `+${tx.quantityChange}` : tx.quantityChange} {unit}
                        </span>
                      </td>

                      {/* Previous -> New Stock */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs">
                        {tx.previousStock !== undefined && tx.newStock !== undefined ? (
                          <span className="text-gray-600">
                            <span className="text-gray-400">{tx.previousStock}</span>
                            <span className="mx-1 text-gray-400">→</span>
                            <span className="font-bold text-gray-800">{tx.newStock} {unit}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Reason / Reference */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs truncate">
                        <div className="font-medium text-gray-800">{tx.reason || tx.notes || 'Routine inventory transaction'}</div>
                        {tx.referenceId && (
                          <div className="text-[11px] font-mono text-gray-400">Ref: {tx.referenceId}</div>
                        )}
                      </td>

                      {/* Logged By */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium">{tx.performedByName || tx.performedBy || 'System Admin'}</span>
                        </div>
                        {tx.role && (
                          <div className="text-[11px] text-gray-400 capitalize pl-5">{tx.role}</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} records
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-2.5 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded border font-medium ${
                    currentPage === page 
                      ? 'bg-[#D81B60] text-white border-[#D81B60]' 
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-2.5 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
