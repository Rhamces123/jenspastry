// ==========================================
// BAKEOLOGY - Artisanal Pastel POS Workstation & Cashier Station
// Built to match exact pastel pink wireframe mockup:
// - Left: Logo + Soft pink pill buttons (POS REGISTER, PRODUCTION RECEIVING, SHIFT OVERVIEW)
// - Center: SEARCH pill + Category pills (CAKE, PASTRY...) + Frosted glass pastry cards (Price top-left, photo center, name pill bottom)
// - Right: REGISTER TRAY with TRAY IS EMPTY, DISCOUNT STRATEGY, PAYMENT METHOD (CASH/GCASH), SUBTOTAL, NET TOTAL DUE
// - Background: Soft pink gradient with floating decorative pastries
// ==========================================

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useShop } from '../../hooks/useShop.js';
import { useAuth } from '../../context/useAuth.js';
import { ROLES } from '../../constants/roles.js';
import ReceiptModal from '../../components/ReceiptModal.jsx';
import NotificationToast from '../../components/NotificationToast.jsx';
import { useBakeryWorkflow } from '../../hooks/useBakeryWorkflow.js';
import ShopManager from '../../patterns/ShopManager.js';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters.js';
import { 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  Search, 
  Printer, 
  RotateCcw, 
  Package, 
  ChefHat, 
  CheckCircle2, 
  TrendingUp, 
  LogOut,
  Sparkles,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import './BakeologyPos.css';

export default function CashierDashboard() {
  const { products, sales, completeSale } = useShop();
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
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

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'receiving' | 'overview' | 'receipts'
  const [posCart, setPosCart] = useState([]);
  const [discountStrategyId, setDiscountStrategyId] = useState('regular');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' | 'GCash' | 'Card'
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

  // Orders State (allows cashier to track and reprint sales)
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
      showToast(`✓ Order completed! ₱${total.toFixed(2)} charged.`, 'success');
    } catch (e) {
      alert("Transaction failed: " + (e.message || e));
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate('/login');
    } catch (e) {
      navigate('/login');
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

  // Categories & Filtering
  const categories = ['All', 'Cakes', 'Cupcakes', 'Muffins', 'Cookies', 'Pastries', 'Tarts', 'Pies', 'Breads', 'Filipino Pastries', 'Brownies'];
  
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || 
      (p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (selectedCategory === 'Cakes' && (p.category === 'Cakes' || p.category === 'Cake')) ||
      (selectedCategory === 'Pastries' && (p.category === 'Pastries' || p.category === 'Pastry'));
    const matchesSearch = p.name.toLowerCase().includes(posSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
      showToast(`✓ Successfully received ${batch.quantity} pcs ${batch.productName}! Added to POS stock.`, 'success');
    } catch (err) {
      showToast(`Failed to receive batch: ${err.message}`, 'error');
    }
  };

  return (
    <div className="bakeology-pos-root">
      {/* 1. FLOATING DECORATIONS LAYER (Matching User Mockup) */}
      <div className="pos-decorations-layer" aria-hidden="true">
        <img src="/decorations/cinnamon-plate.png" alt="" className="pos-decor-item decor-cinnamon-plate" />
        <img src="/decorations/pretzel-top.png" alt="" className="pos-decor-item decor-pretzel-top" />
        <img src="/decorations/croissant-top.png" alt="" className="pos-decor-item decor-croissant-top" />
        <img src="/decorations/cookie-center.png" alt="" className="pos-decor-item decor-cookie-center" />
        <img src="/decorations/brownie-bottom.png" alt="" className="pos-decor-item decor-brownie-bottom" />
        <img src="/decorations/pretzel-bottom.png" alt="" className="pos-decor-item decor-pretzel-bottom" />
        <img src="/decorations/croissant-bottom.png" alt="" className="pos-decor-item decor-croissant-bottom" />
      </div>

      {/* 2. 3-COLUMN BAKEOLOGY WORKSTATION */}
      <div className="bakeology-pos-grid">
        
        {/* =========================================================
            LEFT COLUMN: BRAND & NAVIGATION PILLS
            ========================================================= */}
        <aside className="pos-sidebar-col">
          <Link to="/" className="pos-brand-wrap" title="Go to Storefront">
            <div className="pos-brand-logo-disc">
              <img src="/logo.png" alt="BAKEOLOGY Logo" className="pos-brand-logo-img" />
            </div>
            <span className="pos-brand-caption">BAKEOLOGY EST 2026</span>
          </Link>

          <nav className="pos-nav-pill-list">
            {/* Pill 1: POS REGISTER */}
            <button
              type="button"
              className={`pos-nav-pill-btn ${activeTab === 'pos' ? 'active' : ''}`}
              onClick={() => setActiveTab('pos')}
            >
              <span>POS REGISTER</span>
              {posCart.length > 0 && (
                <span className="pos-nav-badge">{posCart.reduce((s, i) => s + i.quantity, 0)}</span>
              )}
            </button>

            {/* Pill 2: PRODUCTION RECEIVING */}
            <button
              type="button"
              className={`pos-nav-pill-btn ${activeTab === 'receiving' ? 'active' : ''}`}
              onClick={() => setActiveTab('receiving')}
            >
              <span>PRODUCTION RECEIVING</span>
              {readyBatchesCount > 0 && (
                <span className="pos-nav-badge" style={{ background: '#059669' }}>{readyBatchesCount}</span>
              )}
            </button>

            {/* Pill 3: SHIFT OVERVIEW */}
            <button
              type="button"
              className={`pos-nav-pill-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span>SHIFT OVERVIEW</span>
            </button>

            {/* Pill 4: RECEIPT ARCHIVE */}
            <button
              type="button"
              className={`pos-nav-pill-btn ${activeTab === 'receipts' ? 'active' : ''}`}
              onClick={() => setActiveTab('receipts')}
            >
              <span>RECEIPT ARCHIVE</span>
              {allOrders.length > 0 && (
                <span className="pos-nav-badge" style={{ background: '#be185d' }}>{allOrders.length}</span>
              )}
            </button>

            {/* Placeholder Pills (Matching Wireframe Mockup) */}
            <div className="pos-nav-pill-placeholder" title="Reserved Staff Action Slot"></div>
            <div className="pos-nav-pill-placeholder" title="Reserved Staff Action Slot"></div>

            {/* Exit / Return to Store */}
            <Link to="/" className="pos-nav-pill-btn" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.7)' }}>
              <span>STOREFRONT VIEW</span>
            </Link>

            <button
              type="button"
              className="pos-nav-pill-btn"
              onClick={handleLogout}
              style={{ background: 'rgba(255, 230, 240, 0.85)', color: '#991b1b' }}
            >
              <LogOut size={14} />
              <span>LOGOUT</span>
            </button>
          </nav>
        </aside>

        {/* =========================================================
            CENTER COLUMN: SEARCH, CATEGORIES & CATALOG GRID
            ========================================================= */}
        <main className="pos-center-col">
          {/* Top Controls: SEARCH PILL & CATEGORY PILLS */}
          <div className="pos-top-toolbar">
            <div className="pos-search-pill-wrap">
              <input
                type="text"
                placeholder="SEARCH"
                className="pos-search-pill-input"
                value={posSearch}
                onChange={(e) => setPosSearch(e.target.value)}
              />
            </div>

            <div className="pos-category-pills-row">
              <button
                type="button"
                className={`pos-cat-pill-btn ${selectedCategory === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('All')}
              >
                ALL
              </button>

              <button
                type="button"
                className={`pos-cat-pill-btn ${selectedCategory === 'Cakes' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('Cakes')}
              >
                CAKE
              </button>

              <button
                type="button"
                className={`pos-cat-pill-btn ${selectedCategory === 'Pastries' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('Pastries')}
              >
                PASTRY
              </button>

              <button
                type="button"
                className={`pos-cat-pill-btn ${selectedCategory === 'Cookies' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('Cookies')}
              >
                COOKIES
              </button>

              <button
                type="button"
                className={`pos-cat-pill-btn ${selectedCategory === 'Brownies' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('Brownies')}
              >
                BROWNIE
              </button>

              <button
                type="button"
                className={`pos-cat-pill-btn ${selectedCategory === 'Breads' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('Breads')}
              >
                BREAD
              </button>

              <button
                type="button"
                className={`pos-cat-pill-btn ${selectedCategory === 'Tarts' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('Tarts')}
              >
                TARTS
              </button>

              <button
                type="button"
                className={`pos-cat-pill-btn ${selectedCategory === 'Cupcakes' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('Cupcakes')}
              >
                CUPCAKES
              </button>

              <button
                type="button"
                className={`pos-cat-pill-btn ${selectedCategory === 'Muffins' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('Muffins')}
              >
                MUFFINS
              </button>
            </div>
          </div>

          {/* TAB 1: POS REGISTER CATALOG */}
          {activeTab === 'pos' && (
            <div>
              {filteredProducts.length === 0 ? (
                <div className="pos-catalog-empty">
                  <ShoppingBag size={40} className="mx-auto text-muted/60 mb-2" />
                  <p className="font-extrabold text-sm text-black">NO PASTRIES FOUND</p>
                  <p className="text-xs text-muted mt-1">Try another category or clear your search term.</p>
                </div>
              ) : (
                <div className="pos-catalog-grid">
                  {filteredProducts.map(p => {
                    const cartItem = posCart.find(i => i.id === p.id);
                    const inCartQty = cartItem ? cartItem.quantity : 0;
                    const isOutOfStock = p.stock <= 0;
                    const isMaxed = inCartQty >= p.stock;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`pos-frosted-card ${isOutOfStock ? 'is-disabled' : ''}`}
                        onClick={() => addToPosCart(p)}
                        disabled={isOutOfStock || isMaxed}
                        title={`Click to add ${p.name} to Register Tray`}
                      >
                        {/* In-Cart Count Bubble */}
                        {inCartQty > 0 && (
                          <div className="pos-card-in-cart-indicator">
                            {inCartQty}
                          </div>
                        )}

                        {/* Top Row: Price in Top Left */}
                        <div className="pos-card-header-row">
                          <span className="pos-card-price-tag">
                            {p.price % 1 === 0 ? p.price : p.price.toFixed(2)}
                          </span>

                          <span className={`pos-card-stock-tag ${
                            isOutOfStock ? 'sold-out' : p.stock <= 5 ? 'low-stock' : ''
                          }`}>
                            {isOutOfStock ? 'Sold Out' : `${p.stock} left`}
                          </span>
                        </div>

                        {/* Center Image */}
                        <div className="pos-card-img-wrap">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="pos-card-img" />
                          ) : (
                            <span className="pos-card-img-fallback">{p.icon || '🥐'}</span>
                          )}
                        </div>

                        {/* Bottom Name Pill */}
                        <div className="pos-card-name-pill" title={p.name}>
                          {p.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTION RECEIVING VIEW */}
          {activeTab === 'receiving' && (
            <div className="space-y-4">
              <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border-2 border-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-black flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#be185d]" />
                    PRODUCTION RECEIVING STATION
                  </h3>
                  <p className="text-xs text-gray-700 mt-1">
                    Receive freshly baked batches from the kitchen to immediately restock cashier inventory.
                  </p>
                </div>
                <span className="text-xs font-black px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {readyBatchesCount} Batch(es) Ready
                </span>
              </div>

              {/* Ready Batches List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {readyBatches.length === 0 ? (
                  <div className="col-span-2 p-10 text-center bg-white/70 backdrop-blur-md rounded-3xl border-2 border-white">
                    <ChefHat className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    <p className="font-extrabold text-sm text-black">NO BATCHES CURRENTLY WAITING</p>
                    <p className="text-xs text-gray-600 mt-1">When the Baker completes a pastry batch, it will appear here for receiving.</p>
                  </div>
                ) : (
                  readyBatches.map(batch => (
                    <div key={batch.id} className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border-2 border-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-xs font-black text-[#be185d]">
                            #{batch.batchNumber || batch.id}
                          </span>
                          <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Ready
                          </span>
                        </div>
                        <h4 className="font-black text-sm text-black">{batch.productName}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          Quantity: <strong className="text-emerald-700 text-sm">+{batch.quantity} pcs</strong>
                        </p>
                        <p className="text-2xs text-gray-500 mt-0.5">
                          Baked By: {batch.producedBy || 'Baker Staff'} • {formatDateTime(batch.completedAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReceiveBatch(batch)}
                        className="mt-4 w-full py-2.5 px-4 rounded-full bg-[#f2a9d6] hover:bg-[#ed95cc] text-black font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        <span>RECEIVE TO POS STOCK</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SHIFT OVERVIEW & BALANCING */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border-2 border-white shadow-sm">
                  <span className="text-3xs font-black text-gray-500 uppercase tracking-wider block">Shift Revenue</span>
                  <span className="text-xl font-black text-black block mt-1">{formatCurrency(todaySalesTotal)}</span>
                </div>
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border-2 border-white shadow-sm">
                  <span className="text-3xs font-black text-gray-500 uppercase tracking-wider block">Orders Processed</span>
                  <span className="text-xl font-black text-black block mt-1">{allOrders.length}</span>
                </div>
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border-2 border-white shadow-sm">
                  <span className="text-3xs font-black text-gray-500 uppercase tracking-wider block">Cash In Drawer</span>
                  <span className="text-xl font-black text-black block mt-1">{formatCurrency(openingFloat + cashSalesTotal)}</span>
                </div>
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border-2 border-white shadow-sm">
                  <span className="text-3xs font-black text-gray-500 uppercase tracking-wider block">Float Amount</span>
                  <span className="text-xl font-black text-black block mt-1">{formatCurrency(openingFloat)}</span>
                </div>
              </div>

              {/* Drawer Cash Verification */}
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border-2 border-white shadow-sm space-y-3">
                <h4 className="font-extrabold text-sm text-black">DRAWER BALANCING & FLOAT SIGN-OFF</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs font-extrabold text-gray-600 block mb-1">Counted Cash (₱):</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-full border border-gray-300 bg-white font-black text-sm"
                      value={countedCash}
                      onChange={(e) => setCountedCash(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-extrabold text-gray-600 block mb-1">Shift Notes:</label>
                    <input
                      type="text"
                      placeholder="Optional drawer notes..."
                      className="w-full px-3 py-2 rounded-full border border-gray-300 bg-white font-medium text-xs"
                      value={shiftNotes}
                      onChange={(e) => setShiftNotes(e.target.value)}
                    />
                  </div>
                </div>

                {countedCash !== '' && (
                  <div className="p-3 rounded-2xl bg-pink-50 border border-pink-200 text-xs font-bold flex justify-between">
                    <span>Expected: {formatCurrency(openingFloat + cashSalesTotal)}</span>
                    <span className={parseFloat(countedCash) >= (openingFloat + cashSalesTotal) ? 'text-emerald-700' : 'text-rose-700'}>
                      Discrepancy: {formatCurrency(parseFloat(countedCash) - (openingFloat + cashSalesTotal))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RECEIPT ARCHIVE */}
          {activeTab === 'receipts' && (
            <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border-2 border-white shadow-sm space-y-3">
              <h4 className="font-extrabold text-sm text-black">PAST TRANSACTION RECEIPTS ({allOrders.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-3xs font-black text-gray-500 uppercase tracking-wider">
                      <th className="pb-2">Sale #</th>
                      <th className="pb-2">Customer</th>
                      <th className="pb-2">Payment</th>
                      <th className="pb-2 text-right">Total</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allOrders.map(sale => (
                      <tr key={sale.id || sale.saleNumber} className="hover:bg-pink-50/50">
                        <td className="py-2.5 font-black">#{sale.saleNumber}</td>
                        <td className="py-2.5 font-bold">{sale.customerName || 'Walk-in'}</td>
                        <td className="py-2.5">{sale.paymentMethod || 'Cash'}</td>
                        <td className="py-2.5 text-right font-black">{formatCurrency(sale.total)}</td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReceiptSale(sale);
                              setIsReceiptModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-full bg-pink-100 hover:bg-pink-200 font-bold text-2xs"
                          >
                            Reprint
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* =========================================================
            RIGHT COLUMN: REGISTER TRAY & CHECKOUT
            ========================================================= */}
        <aside className="pos-tray-col">
          {/* Header Pill: REGISTER TRAY */}
          <div className="pos-tray-header-pill">
            REGISTER TRAY
          </div>

          {/* Tray Box: TRAY IS EMPTY or List */}
          <div className="pos-tray-box">
            {posCart.length === 0 ? (
              <div className="pos-tray-empty-text">
                TRAY IS EMPTY.
              </div>
            ) : (
              <div className="pos-tray-item-list">
                {posCart.map(item => (
                  <div key={item.id} className="pos-tray-item-row">
                    <div className="pos-tray-item-info">
                      <span className="pos-tray-item-name">{item.name}</span>
                      <span className="pos-tray-item-unit">{formatCurrency(item.price)} each</span>
                    </div>

                    <div className="pos-tray-stepper">
                      <button
                        type="button"
                        className="pos-tray-stepper-btn"
                        onClick={() => updatePosQty(item.id, -1)}
                      >
                        -
                      </button>
                      <span className="pos-tray-stepper-qty">{item.quantity}</span>
                      <button
                        type="button"
                        className="pos-tray-stepper-btn"
                        onClick={() => updatePosQty(item.id, 1)}
                      >
                        +
                      </button>
                    </div>

                    <span className="pos-tray-item-total">
                      {formatCurrency(item.price * item.quantity)}
                    </span>

                    <button
                      type="button"
                      className="pos-tray-remove-btn"
                      onClick={() => removeFromPosCart(item.id)}
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer / Table Tag Input */}
          <input
            type="text"
            placeholder="CUSTOMER NAME / TABLE #"
            className="pos-search-pill-input"
            style={{ width: '100%', fontSize: '11px', padding: '8px 16px' }}
            value={customerNameInput}
            onChange={(e) => setCustomerNameInput(e.target.value)}
          />

          {/* DISCOUNT STRATEGY */}
          <div className="pos-section-group">
            <span className="pos-section-label">DISCOUNT STRATEGY</span>
            <select
              value={discountStrategyId}
              onChange={(e) => setDiscountStrategyId(e.target.value)}
              className="pos-pill-select"
            >
              <option value="regular">STANDARD RETAIL</option>
              <option value="student">STUDENT / SENIOR (5% OFF)</option>
              <option value="bulk">BULK WHOLESALE (10% OFF)</option>
            </select>
          </div>

          {/* PAYMENT METHOD: CASH, GCASH */}
          <div className="pos-section-group">
            <span className="pos-section-label">PAYMENT METHOD:</span>
            <div className="pos-payment-pills-row">
              <button
                type="button"
                className={`pos-pay-pill-btn ${paymentMethod === 'Cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Cash')}
              >
                CASH
              </button>
              <button
                type="button"
                className={`pos-pay-pill-btn ${paymentMethod === 'GCash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('GCash')}
              >
                GCASH
              </button>
              <button
                type="button"
                className={`pos-pay-pill-btn ${paymentMethod === 'Card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Card')}
              >
                CARD
              </button>
            </div>

            {/* If Cash selected: Quick bills & Change calculation */}
            {paymentMethod === 'Cash' && (
              <div style={{ marginTop: '4px' }}>
                <div className="pos-quick-bills-row">
                  {quickBills.map(qb => (
                    <button
                      key={qb.label}
                      type="button"
                      className="pos-quick-bill-pill"
                      onClick={() => setAmountReceived(qb.value.toString())}
                    >
                      {qb.label}
                    </button>
                  ))}
                </div>

                <div className="pos-cash-input-row">
                  <span className="text-2xs font-bold text-gray-700">TENDER: ₱</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pos-cash-input-field"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                  />
                </div>

                {numReceived > 0 && (
                  <div className="pos-change-pill-row" style={{ marginTop: '6px' }}>
                    <span>CHANGE DUE:</span>
                    <span className="font-black text-sm">
                      {numReceived < total 
                        ? `Short ₱${(total - numReceived).toFixed(2)}` 
                        : formatCurrency(changeDue)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SUBTOTAL (X ITEMS) */}
          <div className="pos-section-group">
            <span className="pos-section-label">
              SUBTOTAL ({posCart.reduce((s, i) => s + i.quantity, 0)} ITEMS): {formatCurrency(subtotal)}
            </span>
          </div>

          {/* NET TOTAL DUE */}
          <div className="pos-total-pill-box">
            <span className="pos-total-pill-label">NET TOTAL DUE:</span>
            <span className="pos-total-pill-value">
              {total % 1 === 0 ? total : total.toFixed(2)}
            </span>
          </div>

          {/* CHARGE / COMPLETE SALE BUTTON */}
          <button
            type="button"
            className="pos-checkout-action-btn"
            onClick={handleProcessPayment}
            disabled={posCart.length === 0 || (paymentMethod === 'Cash' && numReceived < total)}
          >
            <CheckCircle size={17} />
            <span>
              {posCart.length === 0 
                ? 'TRAY IS EMPTY' 
                : paymentMethod === 'Cash' && numReceived < total
                ? `ENTER CASH TENDER (₱${total.toFixed(2)})`
                : `COMPLETE SALE (₱${total.toFixed(2)})`}
            </span>
          </button>

          {posCart.length > 0 && (
            <button
              type="button"
              onClick={clearPosCart}
              className="text-3xs font-extrabold text-muted hover:text-black text-center transition-colors uppercase tracking-wider"
            >
              Clear Current Tray
            </button>
          )}
        </aside>

      </div>

      {/* Official Receipt Modal */}
      {isReceiptModalOpen && activeReceiptSale && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setActiveReceiptSale(null);
          }}
          sale={activeReceiptSale}
        />
      )}

      {/* Floating Feedback Toast */}
      {toast.message && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}
    </div>
  );
}
