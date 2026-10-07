// ==========================================
// Jen's Pastry Shop - Cashier Dashboard (Modern Bakery POS & Counter Station)
// Section 8: Dashboard, POS / New Order, Orders, Payments, Receipts, Customers, Shift Summary
// ==========================================

import React, { useState, useMemo, useEffect } from 'react';
import { useShop } from '../../hooks/useShop.js';
import { useAuth } from '../../context/useAuth.js';
import { ROLES } from '../../constants/roles.js';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import ReceiptModal from '../../components/ReceiptModal.jsx';
import NotificationToast from '../../components/NotificationToast.jsx';
import { useBakeryWorkflow } from '../../hooks/useBakeryWorkflow.js';
import ShopManager from '../../patterns/ShopManager.js';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters.js';
import { 
  LayoutDashboard, 
  CreditCard, 
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
  AlertCircle, 
  Sparkles, 
  ShoppingBag, 
  RotateCcw, 
  Banknote, 
  QrCode, 
  Wallet, 
  Package, 
  PackageCheck, 
  CheckCircle2, 
  ChefHat
} from 'lucide-react';

export default function CashierDashboard() {
  const { products, sales, completeSale } = useShop();
  const { currentUser, userProfile } = useAuth();
  const cashierName = userProfile?.fullName || currentUser?.displayName || 'Cashier Staff';

  const { 
    productionBatches, 
    productionRequests, 
    receiveProductionBatch, 
    checkAndTriggerLowStock 
  } = useBakeryWorkflow();

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Auto trigger low-stock check
  useEffect(() => {
    if (products && products.length > 0) {
      checkAndTriggerLowStock(products);
    }
  }, [products, checkAndTriggerLowStock]);

  const readyBatches = useMemo(() => {
    return (productionBatches || []).filter(b => b.status === 'Ready for Cashier');
  }, [productionBatches]);
  const readyBatchesCount = readyBatches.length;

  const [activeTab, setActiveTab] = useState('pos'); // Default directly to POS for cashier efficiency
  const [posCart, setPosCart] = useState([]);
  const [discountStrategyId, setDiscountStrategyId] = useState('regular');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Drawer Balancing State
  const [openingFloat, setOpeningFloat] = useState(1000);
  const [countedCash, setCountedCash] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');

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
  const subtotal = useMemo(() => {
    return posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [posCart]);

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

  const clearPosCart = () => {
    setPosCart([]);
    setAmountReceived('');
    setCustomerNameInput('');
  };

  const handleProcessPayment = () => {
    if (posCart.length === 0) return;

    if (paymentMethod === 'Cash' && numReceived < total) {
      alert(`Amount received (₱${numReceived.toFixed(2)}) is less than total due (₱${total.toFixed(2)})!`);
      return;
    }

    try {
      const customerLabel = customerNameInput.trim() || 'Walk-in Guest';
      const recordedSale = completeSale({
        cart: posCart,
        customerLabel,
        discountStrategyId
      });
      
      const enrichedSale = {
        ...recordedSale,
        customerName: customerLabel,
        paymentMethod,
        amountReceived: paymentMethod === 'Cash' ? numReceived : total,
        change: paymentMethod === 'Cash' ? changeDue : 0,
        orderStatus: 'Confirmed'
      };

      // Add to cashier orders state and persist
      setAllOrders(prev => {
        const updated = [enrichedSale, ...prev];
        try {
          localStorage.setItem('bakeology_sales', JSON.stringify(updated));
        } catch {
          // fallback
        }
        return updated;
      });

      // Reset POS form
      setPosCart([]);
      setAmountReceived('');
      setCustomerNameInput('');
      setActiveReceiptSale(enrichedSale);
      setIsReceiptModalOpen(true);
    } catch (e) {
      alert("Transaction failed: " + (e.message || e));
    }
  };

  // Metrics
  const todaySalesTotal = allOrders.reduce((sum, s) => sum + (s.total || 0), 0);
  const lowStockPastriesCount = useMemo(() => {
    return (products || []).filter(p => (p.stock || 0) <= (p.minimumStock !== undefined ? p.minimumStock : 10)).length;
  }, [products]);

  // Tender breakdowns
  const cashSalesTotal = allOrders
    .filter(o => o.paymentMethod === 'Cash' || !o.paymentMethod)
    .reduce((s, o) => s + (o.total || 0), 0);

  const digitalSalesTotal = allOrders
    .filter(o => o.paymentMethod === 'GCash' || o.paymentMethod === 'Card' || o.paymentMethod === 'Card / E-Wallet')
    .reduce((s, o) => s + (o.total || 0), 0);

  // Categories & Filtering
  const categories = ['All', 'Bread', 'Cake', 'Pastry', 'Beverage'];
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch = p.name.toLowerCase().includes(posSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Drawer Balancing Math
  const expectedDrawerCash = openingFloat + cashSalesTotal;
  const numCountedCash = parseFloat(countedCash) || 0;
  const drawerDiscrepancy = countedCash !== '' ? numCountedCash - expectedDrawerCash : null;

  const quickBills = [
    { label: 'Exact', value: Math.ceil(total) },
    { label: '₱50', value: 50 },
    { label: '₱100', value: 100 },
    { label: '₱200', value: 200 },
    { label: '₱500', value: 500 },
    { label: '₱1,000', value: 1000 }
  ];

  const handleReceiveBatch = (batch) => {
    try {
      receiveProductionBatch(batch.id, cashierName, ShopManager.getInstance());
      showToast(`✓ Successfully received ${batch.quantity} pcs ${batch.productName}! Added to Cashier POS inventory.`, 'success');
    } catch (err) {
      showToast(`Failed to receive batch: ${err.message}`, 'error');
    }
  };

  const navItems = [
    { id: 'pos', label: 'POS Register', icon: CreditCard, badge: posCart.length > 0 ? posCart.length : undefined },
    { id: 'receiving', label: 'Production Receiving', icon: Package, badge: readyBatchesCount > 0 ? readyBatchesCount : undefined },
    { id: 'overview', label: 'Shift Overview', icon: LayoutDashboard },
    { id: 'payments', label: 'Tenders & Ledger', icon: DollarSign },
    { id: 'receipts', label: 'Receipt Archive', icon: Receipt, badge: allOrders.length },
    { id: 'customers', label: 'Counter Guests', icon: Users },
    { id: 'shift', label: 'Drawer Balancing', icon: Briefcase }
  ];

  return (
    <DashboardLayout
      role={ROLES.CASHIER}
      title={
        activeTab === 'pos' ? 'Bakery POS Register' :
        activeTab === 'receiving' ? 'Bakery Production Receiving' :
        activeTab === 'overview' ? 'Cashier Station & Shift Overview' :
        activeTab === 'payments' ? 'Tenders & Payment Ledger' :
        activeTab === 'receipts' ? 'Transaction Receipt Archive' :
        activeTab === 'customers' ? 'Counter Guest Directory' :
        'Drawer Balancing & Shift Summary'
      }
      subtitle={
        activeTab === 'pos' ? 'Select pastries, apply discount strategies, calculate change, and print receipts' :
        activeTab === 'receiving' ? 'Receive finished pastries from Baker and replenish available register stock' :
        activeTab === 'overview' ? "Monitor today's receipts, receiving batches, and register balances" :
        activeTab === 'payments' ? 'Review cash, GCash, and card payments received during shift' :
        activeTab === 'receipts' ? 'Lookup, search, and reprint customer receipts' :
        activeTab === 'customers' ? 'View walk-in and customer order history' :
        'Opening float reconciliation, counted cash verification, and drawer sign-off'
      }
      navigationItems={navItems}
      activeItem={activeTab}
      onSelectItem={setActiveTab}
      headerActions={
        activeTab !== 'pos' ? (
          <button
            type="button"
            className="btn-primary py-1.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow"
            onClick={() => setActiveTab('pos')}
          >
            <CreditCard size={14} />
            <span>Open Register</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold text-muted bg-white px-2.5 py-1 rounded-lg border border-border-light shadow-2xs">
              Cash Float: ₱{openingFloat.toFixed(2)}
            </span>
            <button
              type="button"
              className="py-1 px-2.5 rounded-lg border border-border-medium hover:bg-white text-muted text-2xs font-semibold flex items-center gap-1 transition-all"
              onClick={clearPosCart}
              title="Clear current cart"
            >
              <RotateCcw size={12} />
              <span>Clear Tray</span>
            </button>
          </div>
        )
      }
    >
      {/* 1. POS REGISTER (PRIMARY TAB) */}
      {activeTab === 'pos' && (
        <div className="pos-terminal-layout">
          {/* LEFT: Pastry Catalog Panel */}
          <div className="pos-catalog-panel">
            <div className="pos-catalog-header">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-2.5 text-muted" />
                <input
                  type="text"
                  placeholder="Quick search pastries (e.g. Croissant, Ube, Sourdough)..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-border-medium bg-card text-xs focus:border-primary focus:outline-none"
                  value={posSearch}
                  onChange={e => setPosSearch(e.target.value)}
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-2xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'bg-white text-muted border border-border-light hover:border-primary'
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted bg-card rounded-2xl border border-dashed border-border-medium">
                <ShoppingBag size={32} className="mx-auto text-muted/50 mb-2" />
                <p className="font-bold text-text-primary">No pastries match your search</p>
                <p className="text-2xs text-muted mt-1">Try another category or add new pastries in the Admin Dashboard.</p>
              </div>
            ) : (
              <div className="pos-grid">
                {filteredProducts.map(p => {
                  const cartItem = posCart.find(i => i.id === p.id);
                  const inCartQty = cartItem ? cartItem.quantity : 0;
                  const isOutOfStock = p.stock <= 0;
                  const isMaxed = inCartQty >= p.stock;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`pos-card ${isOutOfStock ? 'disabled' : ''}`}
                      onClick={() => addToPosCart(p)}
                      disabled={isOutOfStock || isMaxed}
                    >
                      {inCartQty > 0 && (
                        <div className="pos-card-badge-tray" title={`${inCartQty} in current tray`}>
                          {inCartQty}
                        </div>
                      )}

                      <div className="flex justify-between items-start">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="pos-card-image" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                        ) : (
                          <span className="pos-card-icon">{p.icon || '🥐'}</span>
                        )}
                        <div className="flex flex-col items-end gap-1">
                          <span className={`pos-stock-badge ${
                            p.stock > (p.minimumStock !== undefined ? p.minimumStock : 10) 
                              ? 'pos-stock-good' 
                              : p.stock > 0 
                              ? 'pos-stock-low' 
                              : 'pos-stock-out'
                          }`}>
                            {p.stock > 0 ? `${p.stock} left` : 'Sold Out'}
                          </span>
                          {readyBatches.some(b => String(b.productId) === String(p.id) || b.productName?.toLowerCase() === p.name?.toLowerCase()) ? (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                              🟢 Ready to Receive
                            </span>
                          ) : productionRequests.some(r => (String(r.productId) === String(p.id) || r.productName?.toLowerCase() === p.name?.toLowerCase()) && r.status !== 'Completed' && r.status !== 'Received') ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              🟡 In Production
                            </span>
                          ) : p.stock <= (p.minimumStock !== undefined ? p.minimumStock : 20) ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                              ⚠️ Low Stock
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-2.5">
                        <span className="pos-card-name" title={p.name}>{p.name}</span>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="pos-card-price">{formatCurrency(p.price)}</span>
                          <span className="text-3xs text-muted uppercase font-semibold tracking-wider">
                            {p.category || 'Bakery'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Order Tray & Payment Terminal */}
          <div className="pos-tray-panel">
            {/* Pinned Tray Header */}
            <div className="pos-tray-header">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-primary" />
                <h3 className="font-extrabold text-xs text-primary font-serif tracking-tight">Active Register Tray</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-extrabold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                  {posCart.reduce((sum, i) => sum + i.quantity, 0)} item(s)
                </span>
                {posCart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearPosCart}
                    className="text-3xs font-bold text-muted hover:text-danger flex items-center gap-0.5 transition-colors"
                    title="Clear tray"
                  >
                    <RotateCcw size={10} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Register Body (Customer, Items, Discount, Tender) */}
            <div className="pos-tray-scrollable-body">
              {/* Customer Tag / Name Input */}
              <div>
                <input
                  type="text"
                  placeholder="Customer Name or Table # (e.g. Walk-in, Maria, Table 2)"
                  className="w-full px-3 py-1.5 rounded-xl border border-border-medium bg-cream-pure text-xs text-text-primary placeholder:text-muted/60 focus:bg-white focus:border-primary focus:outline-none font-medium"
                  value={customerNameInput}
                  onChange={e => setCustomerNameInput(e.target.value)}
                />
              </div>

              {/* Order Items List */}
              <div className="pos-items-scroll">
                {posCart.length === 0 ? (
                  <div className="text-center py-6 px-4">
                    <div className="w-10 h-10 rounded-full bg-cream-pure mx-auto flex items-center justify-center text-muted/60 mb-1.5">
                      <ShoppingBag size={18} />
                    </div>
                    <p className="font-bold text-xs text-text-primary">Tray is empty</p>
                    <p className="text-2xs text-muted mt-0.5">Click pastries on the left to add items to this order.</p>
                  </div>
                ) : (
                  posCart.map(item => (
                    <div key={item.id} className="pos-item-row">
                      <div className="pos-item-info">
                        <span className="pos-item-name">{item.name}</span>
                        <span className="pos-item-unit">{formatCurrency(item.price)} each</span>
                      </div>

                      <div className="pos-stepper">
                        <button
                          type="button"
                          className="pos-stepper-btn"
                          onClick={() => updatePosQty(item.id, -1)}
                          title="Decrease quantity"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="pos-stepper-val">{item.quantity}</span>
                        <button
                          type="button"
                          className="pos-stepper-btn"
                          onClick={() => updatePosQty(item.id, 1)}
                          title="Increase quantity"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <span className="pos-item-total">
                        {formatCurrency(item.price * item.quantity)}
                      </span>

                      <button
                        type="button"
                        className="pos-btn-trash"
                        onClick={() => removeFromPosCart(item.id)}
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Strategy Pattern Discount Box */}
              <div className="pos-discount-box">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-3xs font-bold text-muted uppercase tracking-wider">Discount Strategy:</label>
                  {discountRate > 0 && (
                    <span className="pos-discount-badge">
                      Save {discountRate * 100}%
                    </span>
                  )}
                </div>
                <select
                  value={discountStrategyId}
                  onChange={e => setDiscountStrategyId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border-medium bg-white text-xs font-semibold text-text-primary focus:border-primary focus:outline-none"
                >
                  <option value="regular">Standard Retail (0% Discount)</option>
                  <option value="student">Student / Senior Citizen (5% Discount)</option>
                  <option value="bulk">Bulk Wholesale / Corporate (10% Discount)</option>
                </select>
              </div>

              {/* Payment Method 3-Way Tabs */}
              <div className="mt-1">
                <label className="text-3xs font-bold text-muted uppercase tracking-wider block mb-1">Tender Method:</label>
                <div className="pos-tender-tabs">
                  {[
                    { id: 'Cash', label: 'Cash', icon: Banknote },
                    { id: 'GCash', label: 'GCash / QR', icon: QrCode },
                    { id: 'Card', label: 'Card / POS', icon: Wallet }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = paymentMethod === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        className={`pos-tender-tab ${isActive ? 'active' : ''}`}
                        onClick={() => setPaymentMethod(tab.id)}
                      >
                        <Icon size={13} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Tender Calculation & Quick Bills */}
              {paymentMethod === 'Cash' && (
                <div className="bg-cream-pure p-2.5 rounded-xl border border-border-light mt-1 space-y-2">
                  {/* Quick Bills Row */}
                  <div>
                    <span className="text-3xs font-bold text-muted uppercase tracking-wider block mb-1">Quick Tender:</span>
                    <div className="pos-quick-bills">
                      {quickBills.map(qb => (
                        <button
                          key={qb.label}
                          type="button"
                          className="pos-quick-bill-btn"
                          onClick={() => setAmountReceived(qb.value.toString())}
                        >
                          {qb.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Received Input */}
                  <div className="flex justify-between items-center pt-1 border-t border-border-light">
                    <label className="text-2xs font-bold text-primary">Cash Received (₱):</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-28 px-2 py-1 text-right text-xs font-extrabold rounded-lg border border-border-medium bg-white text-text-primary focus:border-primary focus:outline-none"
                      value={amountReceived}
                      onChange={e => setAmountReceived(e.target.value)}
                    />
                  </div>

                  {/* Live Change Due Banner */}
                  {numReceived > 0 && (
                    <div className="pos-change-banner">
                      <span className="font-bold">Change Due:</span>
                      <span className={changeDue >= 0 ? "font-extrabold text-sm" : "text-danger text-xs"}>
                        {numReceived < total 
                          ? `Short by ${formatCurrency(total - numReceived)}` 
                          : formatCurrency(changeDue)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Digital Payment Notice */}
              {paymentMethod !== 'Cash' && (
                <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 mt-1 text-2xs text-blue-800 flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-600 flex-shrink-0" />
                  <span>
                    Present merchant QR or swipe card for <strong>{formatCurrency(total)}</strong>. Confirmation auto-records to ledger.
                  </span>
                </div>
              )}
            </div>

            {/* Pinned Bottom Footer: Total Due & Checkout Action */}
            <div className="pos-tray-footer space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>Subtotal ({posCart.reduce((sum, i) => sum + i.quantity, 0)} items):</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-success font-semibold">
                  <span>Strategy Discount ({discountRate * 100}%):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-primary border-t border-border-light pt-1.5">
                <span>Net Total Due:</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <button
                type="button"
                className="btn-pos-checkout"
                onClick={handleProcessPayment}
                disabled={posCart.length === 0 || (paymentMethod === 'Cash' && numReceived < total)}
              >
                <CheckCircle size={16} />
                <span>
                  {paymentMethod === 'Cash' 
                    ? `Charge ${formatCurrency(total)} & Print Receipt` 
                    : `Confirm ${paymentMethod} (${formatCurrency(total)})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCTION RECEIVING TAB (Section 13) */}
      {activeTab === 'receiving' && (
        <div className="space-y-6">
          {/* Header & KPI Summary */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Package className="w-6 h-6 text-[#D81B60]" />
                Bakery Production Receiving
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Receive finished pastry batches baked by the kitchen and immediately replenish available cashier POS inventory.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Ready to Receive</span>
              <span className="text-2xl font-extrabold text-emerald-600 block mt-1">{readyBatchesCount}</span>
              <span className="text-xs text-emerald-700 block mt-0.5">Fresh batches waiting at counter</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Total Received Today</span>
              <span className="text-2xl font-extrabold text-[#D81B60] block mt-1">
                {productionBatches.filter(b => b.status === 'Received').length}
              </span>
              <span className="text-xs text-gray-400 block mt-0.5">Batches added to POS stock</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Active in Kitchen</span>
              <span className="text-2xl font-extrabold text-amber-600 block mt-1">
                {productionRequests.filter(r => r.status === 'Preparing' || r.status === 'Accepted' || r.status === 'Pending').length}
              </span>
              <span className="text-xs text-amber-700 block mt-0.5">Production requests in progress</span>
            </div>
          </div>

          {/* Active Batches Waiting for Cashier to Receive */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-amber-600" />
                  Pastries Ready to Receive from Baker ({readyBatchesCount})
                </h4>
                <p className="text-xs text-gray-500">Click [Receive Stock] to increment finished product inventory in the POS register.</p>
              </div>
            </div>

            {readyBatches.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <PackageCheck className="w-12 h-12 mx-auto text-emerald-400" />
                <p className="font-bold text-gray-800 text-base">No Pastries Waiting to be Received</p>
                <p className="text-xs text-gray-500">All baked batches have already been received into register stock. Check back when the baker completes more batches!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {readyBatches.map(batch => {
                  const product = products.find(p => String(p.id) === String(batch.productId) || (p.name && p.name.toLowerCase() === batch.productName.toLowerCase()));
                  const currentStock = product ? Number(product.stock) || 0 : 0;
                  const newStock = currentStock + (Number(batch.quantity) || 0);

                  return (
                    <div 
                      key={batch.id} 
                      className="bg-emerald-50/40 border-2 border-emerald-300 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 inline-block mb-1">
                            🟢 Ready for Cashier
                          </span>
                          <h4 className="font-bold text-gray-900 text-lg">{batch.productName}</h4>
                          <span className="font-mono text-xs font-bold text-gray-500">
                            Production #{batch.batchNumber || batch.id}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black font-mono text-[#D81B60]">
                            +{batch.quantity}
                          </span>
                          <span className="text-xs text-gray-500 block font-bold">pieces</span>
                        </div>
                      </div>

                      {/* Details & Stock Math */}
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Produced By:</span>
                          <span className="font-semibold text-gray-800">{batch.producedBy || 'Baker Staff'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Completion Time:</span>
                          <span className="font-mono text-gray-600">{formatDateTime(batch.completedAt)}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">Stock Adjustment:</span>
                          <span className="font-mono">
                            <span className="text-gray-500">{currentStock} pcs</span>
                            <span className="mx-1 text-gray-400">→</span>
                            <strong className="text-emerald-700 font-extrabold text-sm">{newStock} pcs</strong>
                          </span>
                        </div>
                      </div>

                      {/* Ingredients used reference */}
                      {batch.ingredientsUsed && batch.ingredientsUsed.length > 0 && (
                        <div className="text-[11px] text-gray-500 space-y-1">
                          <span className="font-semibold text-gray-600">Deducted Ingredients:</span>
                          <div className="flex flex-wrap gap-1">
                            {batch.ingredientsUsed.map((ing, i) => (
                              <span key={i} className="bg-white/80 border border-gray-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                {ing.name || ing.ingredientName}: {ing.quantity} {ing.unit}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => handleReceiveBatch(batch)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Receive Stock (+{batch.quantity} {batch.productName})</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historical Received Batches Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h4 className="font-bold text-gray-900 text-base">Recently Received Pastry Batches</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-2.5 px-3">Batch #</th>
                    <th className="py-2.5 px-3">Pastry Name</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3">Produced By</th>
                    <th className="py-2.5 px-3">Received Time</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productionBatches.filter(b => b.status === 'Received').length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-gray-400">
                        No received batches yet.
                      </td>
                    </tr>
                  ) : (
                    productionBatches
                      .filter(b => b.status === 'Received')
                      .slice(0, 10)
                      .map(batch => (
                        <tr key={batch.id} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#D81B60]">
                            {batch.batchNumber || batch.id}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-gray-800">
                            {batch.productName}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                            +{batch.quantity} pcs
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {batch.producedBy || 'Baker Staff'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-gray-500">
                            {formatDateTime(batch.receivedAt || batch.completedAt)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Received
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SHIFT OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card p-4 rounded-2xl border border-border-light shadow-2xs">
              <span className="text-3xs font-bold text-muted uppercase tracking-wider block">Shift Gross Revenue</span>
              <span className="text-xl font-extrabold text-primary block mt-1">{formatCurrency(todaySalesTotal)}</span>
              <span className="text-2xs text-success font-semibold flex items-center gap-1 mt-1">
                <TrendingUp size={11} /> Register Active
              </span>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border-light shadow-2xs">
              <span className="text-3xs font-bold text-muted uppercase tracking-wider block">Transactions Closed</span>
              <span className="text-xl font-extrabold text-text-primary block mt-1">{allOrders.length}</span>
              <span className="text-2xs text-muted font-medium block mt-1">Receipts Generated</span>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 shadow-2xs">
              <span className="text-3xs font-bold text-emerald-800 uppercase tracking-wider block">Ready to Receive</span>
              <span className="text-xl font-extrabold text-emerald-600 block mt-1">{readyBatchesCount}</span>
              <span className="text-2xs text-emerald-700 font-medium block mt-1">Batches from Baker</span>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-rose-100 bg-rose-50/30 shadow-2xs">
              <span className="text-3xs font-bold text-rose-800 uppercase tracking-wider block">Low Stock Pastries</span>
              <span className="text-xl font-extrabold text-rose-600 block mt-1">{lowStockPastriesCount}</span>
              <span className="text-2xs text-rose-700 font-medium block mt-1">Needs Replenishment</span>
            </div>
          </div>

          {/* Quick Action POS Launch Hero */}
          <div className="bg-gradient-to-r from-primary to-accent p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-amber-300" />
                <h3 className="font-extrabold text-base font-serif">Front Counter Register Ready</h3>
              </div>
              <p className="text-xs text-rose-100 mt-1">
                Punch in bakery orders, calculate change with quick bills, apply student/bulk strategies, and print thermal receipts.
              </p>
            </div>
            <button
              type="button"
              className="bg-white text-primary px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm hover:bg-cream-pure flex items-center gap-1.5 transition-all whitespace-nowrap"
              onClick={() => setActiveTab('pos')}
            >
              <span>Launch POS Register</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-card rounded-2xl border border-border-light p-4 shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xs text-primary">Recent Transactions & Receipts</h3>
                <p className="text-3xs text-muted">Latest sales recorded in this register session</p>
              </div>
              <button
                type="button"
                className="text-2xs text-primary font-bold hover:underline"
                onClick={() => setActiveTab('receipts')}
              >
                View All Receipts &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-light text-3xs font-bold text-muted uppercase tracking-wider">
                    <th className="pb-2">Sale #</th>
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Items</th>
                    <th className="pb-2">Tender</th>
                    <th className="pb-2 text-right">Total</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {allOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-xs text-muted">
                        No transactions recorded yet in this register session.
                      </td>
                    </tr>
                  ) : (
                    allOrders.slice(0, 6).map(sale => (
                      <tr key={sale.id || sale.saleNumber} className="hover:bg-cream-pure/60 transition-colors">
                        <td className="py-2.5 font-bold text-primary">#{sale.saleNumber}</td>
                        <td className="py-2.5 text-2xs text-muted">{formatDate(sale.date)}</td>
                        <td className="py-2.5 text-xs font-medium text-text-primary">{sale.customerName || 'Walk-in Guest'}</td>
                        <td className="py-2.5 text-2xs text-muted">
                          {sale.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0} pastry(s)
                        </td>
                        <td className="py-2.5">
                          <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-cream-pure border border-border-light text-text-primary">
                            {sale.paymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-extrabold text-primary">
                          {formatCurrency(sale.total)}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            className="p-1 rounded-lg border border-border-light hover:bg-cream text-primary transition-all"
                            onClick={() => {
                              setActiveReceiptSale(sale);
                              setIsReceiptModalOpen(true);
                            }}
                            title="Print Receipt"
                          >
                            <Printer size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. PAYMENTS & TENDER LEDGER TAB */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-card p-4 rounded-2xl border border-green-200 bg-green-50/40 shadow-2xs">
              <div className="flex items-center gap-2 mb-1">
                <Banknote size={16} className="text-green-700" />
                <span className="text-3xs font-bold text-green-800 uppercase tracking-wider">Cash Tendered</span>
              </div>
              <span className="text-xl font-extrabold text-green-800 block">
                {formatCurrency(cashSalesTotal)}
              </span>
              <span className="text-2xs text-green-700 font-medium block mt-1">
                {allOrders.filter(o => o.paymentMethod === 'Cash' || !o.paymentMethod).length} cash transactions
              </span>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-2xs">
              <div className="flex items-center gap-2 mb-1">
                <QrCode size={16} className="text-blue-700" />
                <span className="text-3xs font-bold text-blue-800 uppercase tracking-wider">Digital & QR (GCash/Card)</span>
              </div>
              <span className="text-xl font-extrabold text-blue-800 block">
                {formatCurrency(digitalSalesTotal)}
              </span>
              <span className="text-2xs text-blue-700 font-medium block mt-1">
                {allOrders.filter(o => o.paymentMethod !== 'Cash' && o.paymentMethod).length} digital settlements
              </span>
            </div>

            <div className="bg-card p-4 rounded-2xl border border-border-light shadow-2xs">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} className="text-primary" />
                <span className="text-3xs font-bold text-muted uppercase tracking-wider">Total Shift Gross</span>
              </div>
              <span className="text-xl font-extrabold text-primary block">
                {formatCurrency(todaySalesTotal)}
              </span>
              <span className="text-2xs text-muted font-medium block mt-1">
                Across {allOrders.length} customer sales
              </span>
            </div>
          </div>

          {/* Detailed Payment Audit Ledger */}
          <div className="bg-card rounded-2xl border border-border-light p-4 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs text-primary">Shift Tender Audit Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-light text-3xs font-bold text-muted uppercase tracking-wider">
                    <th className="pb-2">Sale #</th>
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2">Tender Method</th>
                    <th className="pb-2 text-right">Amount Received</th>
                    <th className="pb-2 text-right">Change Given</th>
                    <th className="pb-2 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {allOrders.map(sale => (
                    <tr key={sale.id || sale.saleNumber} className="hover:bg-cream-pure/60 transition-colors">
                      <td className="py-2.5 font-bold text-primary">#{sale.saleNumber}</td>
                      <td className="py-2.5 text-2xs text-muted">{formatDate(sale.date)}</td>
                      <td className="py-2.5">
                        <span className="font-semibold text-text-primary">{sale.paymentMethod || 'Cash'}</span>
                      </td>
                      <td className="py-2.5 text-right font-medium text-muted">
                        {sale.amountReceived ? formatCurrency(sale.amountReceived) : formatCurrency(sale.total)}
                      </td>
                      <td className="py-2.5 text-right font-medium text-muted">
                        {sale.change ? formatCurrency(sale.change) : '₱0.00'}
                      </td>
                      <td className="py-2.5 text-right font-extrabold text-primary">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. RECEIPTS ARCHIVE TAB */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs text-primary">Pastry Transaction Receipts ({allOrders.length})</h3>
              <p className="text-3xs text-muted">Lookup, view itemized breakdown, and print physical customer receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allOrders.map(sale => (
              <div key={sale.id || sale.saleNumber} className="bg-card p-3.5 rounded-2xl border border-border-light flex justify-between items-center text-xs shadow-2xs hover:border-primary transition-all">
                <div>
                  <span className="font-extrabold text-primary block">Receipt #{sale.saleNumber}</span>
                  <span className="text-2xs text-muted">{formatDate(sale.date)}</span>
                  <span className="text-2xs text-text-primary font-medium block mt-0.5">{sale.customerName || 'Walk-in Guest'}</span>
                  <span className="text-xs font-extrabold text-text-primary block mt-1">{formatCurrency(sale.total)}</span>
                </div>
                <button
                  type="button"
                  className="btn-secondary py-1.5 px-3 rounded-xl text-2xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-cream"
                  onClick={() => {
                    setActiveReceiptSale(sale);
                    setIsReceiptModalOpen(true);
                  }}
                >
                  <Printer size={13} />
                  <span>Reprint</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. COUNTER GUESTS TAB */}
      {activeTab === 'customers' && (
        <div className="bg-card rounded-2xl border border-border-light p-4 shadow-2xs space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs text-primary">Counter Guest & Customer Directory</h3>
              <p className="text-3xs text-muted">All customers served during this register session</p>
            </div>
            <span className="text-2xs font-bold text-muted bg-cream-pure px-2.5 py-1 rounded-lg border border-border-light">
              {allOrders.length} Patrons
            </span>
          </div>

          <div className="divide-y divide-border-light">
            {allOrders.map((o, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center text-xs hover:bg-cream-pure/40 px-2 rounded-xl transition-colors">
                <div>
                  <span className="font-bold text-primary block">{o.customerName || 'Walk-in Guest'}</span>
                  <span className="text-3xs text-muted">{o.customerEmail || 'In-store Counter Purchase'} • {formatDate(o.date)}</span>
                  <div className="text-3xs text-muted/80 mt-0.5">
                    {o.items?.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-xs text-primary block">{formatCurrency(o.total)}</span>
                  <span className="text-3xs text-muted font-mono">Sale #{o.saleNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SHIFT SUMMARY & DRAWER BALANCING TAB */}
      {activeTab === 'shift' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="shift-audit-card">
            <div className="flex justify-between items-center border-b border-border-light pb-2.5 mb-3">
              <div>
                <h3 className="font-extrabold text-sm text-primary font-serif">Cash Drawer Balancing & Reconciliation</h3>
                <p className="text-3xs text-muted">End-of-shift register reconciliation and cash drop audit</p>
              </div>
              <Briefcase size={20} className="text-primary" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="shift-audit-row">
                <span className="text-muted">Opening Cash Float:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-text-primary">₱</span>
                  <input
                    type="number"
                    value={openingFloat}
                    onChange={e => setOpeningFloat(parseFloat(e.target.value) || 0)}
                    className="w-24 text-right px-2 py-0.5 rounded border border-border-medium bg-white font-bold text-xs"
                  />
                </div>
              </div>

              <div className="shift-audit-row">
                <span className="text-muted">Shift Cash In (Net Sales):</span>
                <span className="font-bold text-success">+{formatCurrency(cashSalesTotal)}</span>
              </div>

              <div className="shift-audit-row">
                <span className="text-muted">Digital Settlements (GCash / Card):</span>
                <span className="font-bold text-blue-600">+{formatCurrency(digitalSalesTotal)}</span>
              </div>

              <div className="shift-audit-row bg-cream-pure p-2 rounded-xl border border-border-light font-extrabold text-primary text-sm">
                <span>Expected Cash In Drawer:</span>
                <span>{formatCurrency(expectedDrawerCash)}</span>
              </div>

              {/* Physical Count Input */}
              <div className="pt-2 border-t border-border-light">
                <label className="text-2xs font-bold text-primary block mb-1">
                  Physical Cash Counted (₱):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter physical cash in drawer..."
                    className="flex-1 px-3 py-2 rounded-xl border border-border-medium bg-white font-extrabold text-sm text-text-primary focus:border-primary focus:outline-none"
                    value={countedCash}
                    onChange={e => setCountedCash(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 rounded-xl text-xs font-bold"
                    onClick={() => setCountedCash(expectedDrawerCash.toFixed(2))}
                  >
                    Match Expected
                  </button>
                </div>
              </div>

              {/* Discrepancy Status Callout */}
              {drawerDiscrepancy !== null && (
                <div className={`p-3 rounded-xl border text-xs font-bold flex justify-between items-center ${
                  drawerDiscrepancy === 0 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : drawerDiscrepancy > 0 
                    ? 'bg-blue-50 border-blue-200 text-blue-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {drawerDiscrepancy === 0 ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                    <span>
                      {drawerDiscrepancy === 0 
                        ? 'Drawer Perfectly Balanced!' 
                        : drawerDiscrepancy > 0 
                        ? 'Cash Drawer Over:' 
                        : 'Cash Drawer Short:'}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold">
                    {drawerDiscrepancy === 0 ? '₱0.00' : formatCurrency(Math.abs(drawerDiscrepancy))}
                  </span>
                </div>
              )}

              {/* Shift Notes */}
              <div className="pt-2">
                <label className="text-3xs font-bold text-muted uppercase tracking-wider block mb-1">Cashier Shift Notes / Handover:</label>
                <textarea
                  rows={2}
                  placeholder="Record any register variances, damaged stock, or customer notes for next shift..."
                  className="w-full p-2.5 rounded-xl border border-border-medium bg-white text-xs text-text-primary focus:border-primary focus:outline-none"
                  value={shiftNotes}
                  onChange={e => setShiftNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border-light flex gap-2">
              <button
                type="button"
                className="btn-primary flex-1 py-2 rounded-xl text-xs font-bold shadow-sm"
                onClick={() => {
                  alert(`Shift reconciled successfully! Expected: ${formatCurrency(expectedDrawerCash)}, Counted: ${countedCash ? formatCurrency(numCountedCash) : 'N/A'}`);
                }}
              >
                Sign Off & Close Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={activeReceiptSale}
      />

      {/* NOTIFICATION TOAST */}
      {toast.message && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}
    </DashboardLayout>
  );
}
