// ==========================================
// Jen's Pastry Shop - Cashier Dashboard (POS & Operations)
// Section 8: Dashboard, POS / New Order, Orders, Payments, Receipts, Customers, Shift Summary, Logout
// ==========================================

import React, { useState } from 'react';
import { useShop } from '../../hooks/useShop.js';
import { ROLES } from '../../constants/roles.js';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import ReceiptModal from '../../components/ReceiptModal.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { 
  LayoutDashboard, 
  CreditCard, 
  ClipboardList, 
  DollarSign, 
  Receipt, 
  Users, 
  Briefcase, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  Search, 
  Printer, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function CashierDashboard() {
  const { products, sales, summary, completeSale } = useShop();

  const [activeTab, setActiveTab] = useState('overview');
  const [posCart, setPosCart] = useState([]);
  const [discountStrategyId, setDiscountStrategyId] = useState('regular');
  const [customerType, setCustomerType] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Receipt Modal
  const [activeReceiptSale, setActiveReceiptSale] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Orders State (allows cashier to confirm / advance order status)
  const [allOrders, setAllOrders] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bakeology_sales') || '[]');
      return stored.length > 0 ? stored : sales;
    } catch {
      return sales;
    }
  });

  // Calculate POS totals
  const subtotal = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountRate = discountStrategyId === 'student' ? 0.05 : discountStrategyId === 'bulk' ? 0.10 : 0;
  const discountAmount = subtotal * discountRate;
  const total = subtotal - discountAmount;

  const numReceived = parseFloat(amountReceived) || 0;
  const changeDue = Math.max(0, numReceived - total);

  // POS operations
  const addToPosCart = (product) => {
    if (product.stock <= 0) return;
    setPosCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updatePosQty = (productId, delta) => {
    setPosCart(prev => prev.map(item => {
      if (item.id === productId) {
        const product = products.find(p => p.id === productId);
        const maxStock = product ? product.stock : 999;
        const next = item.quantity + delta;
        if (next <= 0) return null;
        if (next > maxStock) return item;
        return { ...item, quantity: next };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromPosCart = (productId) => {
    setPosCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleProcessPayment = () => {
    if (posCart.length === 0) return;

    if (paymentMethod === 'Cash' && numReceived < total) {
      alert(`Amount received (₱${numReceived}) is less than total due (₱${total.toFixed(2)})!`);
      return;
    }

    try {
      const recordedSale = completeSale(posCart, customerType, discountStrategyId);
      
      const enrichedSale = {
        ...recordedSale,
        paymentMethod,
        amountReceived: paymentMethod === 'Cash' ? numReceived : total,
        change: paymentMethod === 'Cash' ? changeDue : 0,
        orderStatus: 'Confirmed'
      };

      // Add to cashier orders
      setAllOrders(prev => [enrichedSale, ...prev]);

      // Reset POS
      setPosCart([]);
      setAmountReceived('');
      setActiveReceiptSale(enrichedSale);
      setIsReceiptModalOpen(true);
    } catch (e) {
      alert("Transaction failed: " + (e.message || e));
    }
  };

  // Advance Order Status (Cashier confirms order -> moves to Preparing for Baker)
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setAllOrders(prev => prev.map(order => {
      if (order.id === orderId || order.saleNumber === orderId) {
        return { ...order, orderStatus: newStatus };
      }
      return order;
    }));
  };

  // Metrics
  const todaySalesTotal = allOrders.reduce((sum, s) => sum + (s.total || 0), 0);
  const pendingOrdersCount = allOrders.filter(o => !o.orderStatus || o.orderStatus === 'Pending').length;
  const completedOrdersCount = allOrders.filter(o => o.orderStatus === 'Completed').length;

  const categories = ['All', 'Bread', 'Cake', 'Pastry', 'Beverage'];
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(posSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS / New Order', icon: CreditCard, badge: posCart.length > 0 ? posCart.length : undefined },
    { id: 'orders', label: 'Orders', icon: ClipboardList, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'receipts', label: 'Receipts', icon: Receipt, badge: allOrders.length },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'shift', label: 'Shift Summary', icon: Briefcase }
  ];

  return (
    <DashboardLayout
      role={ROLES.CASHIER}
      title={
        activeTab === 'overview' ? 'Cashier Station & POS Overview' :
        activeTab === 'pos' ? 'Point of Sale (POS) Register' :
        activeTab === 'orders' ? 'Customer Order Management' :
        activeTab === 'payments' ? 'Tender & Payment Processing' :
        activeTab === 'receipts' ? 'Transaction Receipt Records' :
        activeTab === 'customers' ? 'Pastry Customer Records' :
        'Cashier Shift Summary'
      }
      subtitle={
        activeTab === 'overview' ? "Monitor today's receipts, active orders, and register balances" :
        activeTab === 'pos' ? 'Add pastries to basket, apply discounts, and tender payment' :
        activeTab === 'orders' ? 'Confirm pending customer orders and dispatch to baker' :
        activeTab === 'payments' ? 'Review cash and digital payments received during shift' :
        activeTab === 'receipts' ? 'Lookup and print customer receipts' :
        activeTab === 'customers' ? 'View walk-in and online customers' :
        'Current drawer total and shift balance'
      }
      navigationItems={navItems}
      activeItem={activeTab}
      onSelectItem={setActiveTab}
      headerActions={
        activeTab !== 'pos' ? (
          <button
            type="button"
            className="btn-primary py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            onClick={() => setActiveTab('pos')}
          >
            <CreditCard size={14} />
            <span>Open Register</span>
          </button>
        ) : null
      }
    >
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card p-4 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs font-bold text-muted block uppercase">Today's Sales</span>
              <span className="text-xl font-extrabold text-primary block mt-1">{formatCurrency(todaySalesTotal)}</span>
              <span className="text-2xs text-success font-semibold flex items-center gap-0.5 mt-1">
                <TrendingUp size={11} /> Register Active
              </span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs font-bold text-muted block uppercase">Orders Today</span>
              <span className="text-xl font-extrabold text-text-primary block mt-1">{allOrders.length}</span>
              <span className="text-2xs text-muted font-medium block mt-1">Transactions</span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs font-bold text-muted block uppercase">Pending Orders</span>
              <span className="text-xl font-extrabold text-amber-600 block mt-1">{pendingOrdersCount}</span>
              <span className="text-2xs text-amber-700 font-medium block mt-1">Need Confirmation</span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs font-bold text-muted block uppercase">Completed Orders</span>
              <span className="text-xl font-extrabold text-success block mt-1">{completedOrdersCount}</span>
              <span className="text-2xs text-muted font-medium block mt-1">Picked Up</span>
            </div>
          </div>

          {/* Quick POS Trigger Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 rounded-2xl text-white shadow-md flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base font-serif">Ready for Next Customer?</h3>
              <p className="text-xs text-blue-100 mt-0.5">Punch in pastries, calculate change, and print receipts.</p>
            </div>
            <button
              type="button"
              className="bg-white text-blue-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-blue-50 flex items-center gap-1.5 transition-all"
              onClick={() => setActiveTab('pos')}
            >
              <span>New POS Sale</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Recent Shift Sales Table */}
          <div className="bg-card rounded-xl border border-border-light p-3.5 shadow-2xs space-y-2">
            <h3 className="font-bold text-xs text-primary">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-light text-2xs text-muted uppercase">
                    <th className="pb-2">Sale #</th>
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Items</th>
                    <th className="pb-2">Payment</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {allOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-2xs text-muted">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    allOrders.slice(0, 5).map(sale => (
                      <tr key={sale.id} className="hover:bg-cream-pure">
                        <td className="py-2 font-bold text-primary">#{sale.saleNumber}</td>
                        <td className="py-2 text-2xs text-muted">{formatDate(sale.date)}</td>
                        <td className="py-2 text-2xs">{sale.items?.length || 0} item(s)</td>
                        <td className="py-2 text-2xs font-semibold">{sale.paymentMethod || 'Cash'}</td>
                        <td className="py-2 text-right font-bold text-primary">{formatCurrency(sale.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. POS / NEW ORDER TAB */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Product Selector (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            {/* Search and Category Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2.5 text-muted" />
                <input
                  type="text"
                  placeholder="Quick search pastries..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border-medium bg-card text-xs focus:border-primary"
                  value={posSearch}
                  onChange={e => setPosSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-2xs font-bold whitespace-nowrap ${
                      selectedCategory === cat ? 'bg-primary text-white shadow-sm' : 'bg-card text-muted border border-border-light'
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Quick-Tap Grid */}
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted bg-card rounded-xl border border-border-light">
                No pastries found in catalog. Add pastries first via the Admin Dashboard.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="bg-card p-3 rounded-xl border border-border-light hover:border-primary flex flex-col justify-between text-left transition-all hover:shadow-sm"
                    onClick={() => addToPosCart(p)}
                    disabled={p.stock <= 0}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-2xl">{p.icon || '🥐'}</span>
                      <span className={`text-2xs px-1.5 py-0.5 rounded font-bold ${
                        p.stock > 10 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.stock} left
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="font-bold text-xs text-primary block truncate">{p.name}</span>
                      <span className="font-extrabold text-xs text-text-primary block mt-0.5">{formatCurrency(p.price)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: POS Tray & Payment Tender (1 col) */}
          <div className="bg-card p-4 rounded-2xl border border-border-light shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-center border-b border-border-light pb-2 mb-2">
                <h3 className="font-bold text-xs text-primary">Current Order Tray</h3>
                <span className="text-2xs font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {posCart.length} item(s)
                </span>
              </div>

              {/* Items in Tray */}
              <div className="max-h-48 overflow-y-auto divide-y divide-border-light mb-3">
                {posCart.length === 0 ? (
                  <p className="text-center text-xs text-muted py-6">Tap pastries on the left to add.</p>
                ) : (
                  posCart.map(item => (
                    <div key={item.id} className="py-2 flex justify-between items-center text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-primary block truncate">{item.name}</span>
                        <span className="text-2xs text-muted">{formatCurrency(item.price)} ea</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="w-5 h-5 rounded bg-cream border border-border-medium flex items-center justify-center text-xs"
                          onClick={() => updatePosQty(item.id, -1)}
                        >
                          -
                        </button>
                        <span className="text-xs font-bold min-w-[16px] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          className="w-5 h-5 rounded bg-cream border border-border-medium flex items-center justify-center text-xs"
                          onClick={() => updatePosQty(item.id, 1)}
                        >
                          +
                        </button>
                        <span className="font-bold text-xs min-w-[50px] text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          className="text-muted hover:text-red-500 p-0.5"
                          onClick={() => removeFromPosCart(item.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount & Customer Type */}
              <div className="space-y-2 border-t border-border-light pt-2 text-xs">
                <div>
                  <label className="text-2xs font-bold text-muted block mb-0.5">Discount Plan:</label>
                  <select
                    value={discountStrategyId}
                    onChange={e => setDiscountStrategyId(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-border-medium bg-cream-pure text-xs font-medium"
                  >
                    <option value="regular">Regular Customer (0%)</option>
                    <option value="student">Student / Senior (5%)</option>
                    <option value="bulk">Bulk Order (10%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-2xs font-bold text-muted block mb-0.5">Tender Method:</label>
                  <div className="flex gap-2">
                    {['Cash', 'Card / E-Wallet'].map(m => (
                      <button
                        key={m}
                        type="button"
                        className={`flex-1 py-1 rounded-lg text-2xs font-bold border ${
                          paymentMethod === m ? 'bg-primary text-white border-primary' : 'bg-cream-pure border-border-medium text-muted'
                        }`}
                        onClick={() => setPaymentMethod(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Calculator */}
                {paymentMethod === 'Cash' && (
                  <div className="bg-cream-pure p-2 rounded-lg border border-border-light space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-2xs font-bold text-primary">Cash Received:</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-24 p-1 text-right text-xs font-bold rounded border border-border-medium bg-white"
                        value={amountReceived}
                        onChange={e => setAmountReceived(e.target.value)}
                      />
                    </div>
                    {numReceived > 0 && (
                      <div className="flex justify-between text-2xs font-bold pt-1 border-t border-border-light">
                        <span>Change to Give:</span>
                        <span className={changeDue >= 0 ? "text-success text-sm" : "text-danger"}>
                          {formatCurrency(changeDue)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Totals & Submit */}
            <div className="border-t border-border-light pt-2 space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-success font-semibold">
                  <span>Discount ({discountRate * 100}%):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-primary">
                <span>Total Due:</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <button
                type="button"
                className="btn-primary w-full py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                onClick={handleProcessPayment}
                disabled={posCart.length === 0}
              >
                <CheckCircle size={15} />
                <span>Complete Sale & Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xs text-primary">Customer Order Pipeline ({allOrders.length})</h3>
            <span className="text-2xs text-muted">Confirming orders notifies the Baker</span>
          </div>

          {allOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted bg-card rounded-xl border border-border-light">
              No orders in pipeline. New orders placed online or via POS will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allOrders.map(order => (
                <div key={order.id} className="bg-card p-3.5 rounded-xl border border-border-light space-y-2 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-xs text-primary block">Order #{order.saleNumber}</span>
                      <span className="text-2xs text-muted">Customer: {order.customerName || 'Walk-in'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-2xs font-extrabold border ${
                      order.orderStatus === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                      order.orderStatus === 'Ready for Pickup' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      order.orderStatus === 'Preparing' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-pink-100 text-primary border-border-light'
                    }`}>
                      {order.orderStatus || 'Pending'}
                    </span>
                  </div>

                  <div className="bg-cream-pure p-2 rounded-lg text-2xs space-y-1">
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.name} × {it.quantity}</span>
                        <span>{formatCurrency(it.price * it.quantity)}</span>
                      </div>
                    ))}
                    <div className="pt-1 border-t border-border-light flex justify-between font-bold text-primary">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    {(!order.orderStatus || order.orderStatus === 'Pending') && (
                      <button
                        type="button"
                        className="btn-primary py-1 px-3 rounded-lg text-2xs font-bold flex-1"
                        onClick={() => handleUpdateOrderStatus(order.id, 'Confirmed')}
                      >
                        Confirm Order
                      </button>
                    )}
                    {order.orderStatus === 'Ready for Pickup' && (
                      <button
                        type="button"
                        className="bg-green-600 text-white hover:bg-green-700 py-1 px-3 rounded-lg text-2xs font-bold flex-1"
                        onClick={() => handleUpdateOrderStatus(order.id, 'Completed')}
                      >
                        Mark Completed (Picked Up)
                      </button>
                    )}
                    <button
                      type="button"
                      className="p-1 rounded-lg border border-border-medium hover:bg-cream text-muted text-2xs"
                      onClick={() => {
                        setActiveReceiptSale(order);
                        setIsReceiptModalOpen(true);
                      }}
                      title="View Receipt"
                    >
                      <Receipt size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="space-y-4 max-w-xl mx-auto">
          <div className="bg-card p-4 rounded-xl border border-border-light space-y-3 shadow-2xs">
            <h3 className="font-bold text-xs text-primary">Shift Payment Tender Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <span className="text-2xs text-green-700 font-bold block uppercase">Cash Tendered</span>
                <span className="text-base font-extrabold text-green-800">
                  {formatCurrency(allOrders.filter(o => o.paymentMethod === 'Cash' || !o.paymentMethod).reduce((s, o) => s + o.total, 0))}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-2xs text-blue-700 font-bold block uppercase">Card / E-Wallet</span>
                <span className="text-base font-extrabold text-blue-800">
                  {formatCurrency(allOrders.filter(o => o.paymentMethod === 'Card / E-Wallet').reduce((s, o) => s + o.total, 0))}
                </span>
              </div>
            </div>

            <div className="p-3 bg-cream-pure rounded-lg border border-border-light text-2xs text-muted space-y-1">
              <div className="flex justify-between">
                <span>Total Register Gross:</span>
                <span className="font-bold text-primary">{formatCurrency(todaySalesTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Transactions:</span>
                <span className="font-bold text-primary">{allOrders.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. RECEIPTS TAB */}
      {activeTab === 'receipts' && (
        <div className="space-y-3">
          <h3 className="font-bold text-xs text-primary">All Printable Receipts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allOrders.map(sale => (
              <div key={sale.id} className="bg-card p-3 rounded-xl border border-border-light flex justify-between items-center text-xs shadow-2xs">
                <div>
                  <span className="font-bold text-primary block">Receipt #{sale.saleNumber}</span>
                  <span className="text-2xs text-muted">{formatDate(sale.date)}</span>
                  <span className="text-2xs font-extrabold text-text-primary block mt-0.5">{formatCurrency(sale.total)}</span>
                </div>
                <button
                  type="button"
                  className="btn-secondary py-1 px-2.5 rounded-lg text-2xs font-bold flex items-center gap-1 shadow-2xs"
                  onClick={() => {
                    setActiveReceiptSale(sale);
                    setIsReceiptModalOpen(true);
                  }}
                >
                  <Printer size={12} />
                  <span>Print</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="bg-card rounded-xl border border-border-light p-4 shadow-2xs space-y-3">
          <h3 className="font-bold text-xs text-primary">Customer Directory</h3>
          <p className="text-2xs text-muted">Customers who placed orders today:</p>
          <div className="divide-y divide-border-light">
            {allOrders.map((o, idx) => (
              <div key={idx} className="py-2 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-primary block">{o.customerName || 'Walk-in Guest'}</span>
                  <span className="text-2xs text-muted">{o.customerEmail || 'counter purchase'}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs text-primary">{formatCurrency(o.total)}</span>
                  <span className="text-2xs text-muted block">Sale #{o.saleNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SHIFT SUMMARY TAB */}
      {activeTab === 'shift' && (
        <div className="space-y-4 max-w-md mx-auto">
          <div className="bg-card p-4 rounded-xl border border-border-light space-y-3 shadow-2xs">
            <h3 className="font-bold text-xs text-primary">Cashier Shift Drawer Balance</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border-light">
                <span className="text-muted">Opening Cash Float:</span>
                <span className="font-bold">₱1,000.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-light">
                <span className="text-muted">Total Shift Cash In:</span>
                <span className="font-bold text-success">
                  +{formatCurrency(allOrders.filter(o => o.paymentMethod === 'Cash' || !o.paymentMethod).reduce((s, o) => s + o.total, 0))}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-light">
                <span className="text-muted">Total Non-Cash (Card/App):</span>
                <span className="font-bold text-blue-600">
                  +{formatCurrency(allOrders.filter(o => o.paymentMethod === 'Card / E-Wallet').reduce((s, o) => s + o.total, 0))}
                </span>
              </div>
              <div className="flex justify-between py-1 font-extrabold text-sm text-primary pt-2 border-t border-border-medium">
                <span>Total Expected Cash in Drawer:</span>
                <span>
                  {formatCurrency(1000 + allOrders.filter(o => o.paymentMethod === 'Cash' || !o.paymentMethod).reduce((s, o) => s + o.total, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={activeReceiptSale}
      />
    </DashboardLayout>
  );
}
