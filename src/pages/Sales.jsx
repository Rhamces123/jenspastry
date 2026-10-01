// ==========================================
// Jen's Pastry Shop - Sales & Checkout Page
// Implements POS, Strategy Pattern Discounts, and Sales History
// ==========================================

import React, { useState, useMemo } from 'react';
import CartItem from '../components/CartItem.jsx';
import SaleCard from '../components/SaleCard.jsx';
import { 
  AVAILABLE_STRATEGIES, 
  getDiscountStrategy 
} from '../patterns/DiscountStrategies.js';
import { formatCurrency } from '../utils/formatters.js';
import { 
  ShoppingCart, 
  History, 
  Search, 
  Percent, 
  Receipt
} from 'lucide-react';

export default function Sales({
  products,
  sales,
  cart,
  setCart,
  onCompleteSale,
  onViewReceipt
}) {
  // VARIABLES: Active view mode ('pos' | 'history')
  const [activeTab, setActiveTab] = useState('pos');
  const [productSearch, setProductSearch] = useState('');
  const [salesSearch, setSalesSearch] = useState('');

  // STRATEGY PATTERN
  // Allows different discount methods to be selected during checkout.
  // Stores the selected discount strategy ID: 'regular' | 'student' | 'bulk'
  const [selectedStrategyId, setSelectedStrategyId] = useState('regular');

  // FUNCTIONS: Cart manipulation
  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        // Enforce maximum available stock
        if (existing.quantity >= product.stock) {
          return prevCart;
        }
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const increaseQuantity = (productId) => {
    const liveProduct = products.find(p => p.id === productId);
    if (!liveProduct) return;

    setCart(prevCart =>
      prevCart.map(item => {
        if (item.product.id === productId) {
          if (item.quantity >= liveProduct.stock) return item;
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      })
    );
  };

  const decreaseQuantity = (productId) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.max(1, item.quantity - 1) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // FUNCTIONS: Financial Calculations using Strategy Pattern
  const { subtotal, discount, total, activeStrategy } = useMemo(() => {
    // 1. Calculate subtotal
    const sub = cart.reduce((acc, item) => {
      return acc + (item.product.price * item.quantity);
    }, 0);

    // 2. STRATEGY PATTERN
    // The active strategy object performs the calculation without if/else branching
    const strategy = getDiscountStrategy(selectedStrategyId);
    const disc = strategy.calculateDiscount(sub);
    const tot = Math.max(0, sub - disc);

    return {
      subtotal: sub,
      discount: disc,
      total: tot,
      activeStrategy: strategy
    };
  }, [cart, selectedStrategyId]);

  // Handle Checkout submission
  const handleCheckout = () => {
    if (cart.length === 0) return;

    try {
      onCompleteSale({
        cart,
        discountStrategyId: selectedStrategyId
      });
      clearCart();
    } catch (err) {
      alert(`Sale failed: ${err.message}`);
    }
  };

  // Filter products for quick selection
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  // Filter sales history
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const saleId = String(s.saleNumber || s.id);
      const query = salesSearch.toLowerCase();
      return (
        saleId.toLowerCase().includes(query) ||
        s.customerType.toLowerCase().includes(query) ||
        (s.items && s.items.some(i => i.name.toLowerCase().includes(query)))
      );
    });
  }, [sales, salesSearch]);

  return (
    <div className="page-content sales-page space-y-4">
      {/* Sub Navigation Switcher */}
      <div className="sub-tab-switcher">
        <button
          type="button"
          className={`sub-tab-btn ${activeTab === 'pos' ? 'sub-tab-btn-active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          <ShoppingCart size={16} />
          <span>Point of Sale</span>
          {cart.length > 0 && (
            <span className="sub-tab-badge">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
          )}
        </button>

        <button
          type="button"
          className={`sub-tab-btn ${activeTab === 'history' ? 'sub-tab-btn-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          <span>Sales History</span>
          <span className="sub-tab-badge-muted">{sales.length}</span>
        </button>
      </div>

      {activeTab === 'pos' ? (
        /* ================= POINT OF SALE (POS) ================= */
        <div className="pos-layout space-y-4">
          {/* Quick Select Pastry Picker */}
          <div className="mobile-card pos-picker-card">
            <div className="flex justify-between items-center mb-3">
              <h3 className="section-title">Select Pastries</h3>
              <span className="text-xs text-muted">Tap to add to cart</span>
            </div>

            <div className="search-bar-wrapper mb-3">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input text-sm"
                placeholder="Find pastry..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
              />
            </div>

            {/* Quick Touch Grid */}
            <div className="pos-item-grid">
              {filteredProducts.map(p => {
                const inCart = cart.find(c => c.product.id === p.id);
                const isOutOfStock = p.stock === 0;
                const isMaxReached = inCart && inCart.quantity >= p.stock;

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isOutOfStock || isMaxReached}
                    className={`pos-product-pill ${isOutOfStock ? 'pos-pill-disabled' : ''} ${inCart ? 'pos-pill-in-cart' : ''}`}
                    onClick={() => addToCart(p)}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="pos-product-name truncate">{p.name}</span>
                      <span className="pos-product-price">{formatCurrency(p.price)}</span>
                    </div>
                    <div className="flex justify-between items-center w-full mt-1">
                      <span className="text-2xs text-muted">
                        {isOutOfStock ? 'Sold Out' : `Stock: ${p.stock}`}
                      </span>
                      {inCart && (
                        <span className="pos-badge-qty">x{inCart.quantity}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart & Checkout Section */}
          <div className="mobile-card cart-container-card">
            <div className="flex justify-between items-center pb-2 border-b border-border-light mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-primary" />
                <h3 className="section-title">Order Cart</h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-danger font-medium hover:underline"
                  onClick={clearCart}
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length > 0 ? (
              <div className="cart-items-list space-y-2 mb-4">
                {cart.map(item => {
                  const liveProd = products.find(p => p.id === item.product.id) || item.product;
                  return (
                    <CartItem
                      key={item.product.id}
                      item={item}
                      availableStock={liveProd.stock}
                      onIncrease={increaseQuantity}
                      onDecrease={decreaseQuantity}
                      onRemove={removeFromCart}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="empty-cart-state text-center py-6">
                <span className="text-3xl block mb-2">🛒</span>
                <p className="font-medium text-sm text-foreground">Your cart is empty</p>
                <p className="text-xs text-muted">Select pastries above to start building the order.</p>
              </div>
            )}

            {/* STRATEGY PATTERN: Discount Selection */}
            {cart.length > 0 && (
              <div className="discount-strategy-section pt-3 border-t border-border-light mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Percent size={16} className="text-secondary" />
                  <label className="text-xs font-bold uppercase tracking-wider text-muted">
                    Customer Discount Strategy
                  </label>
                </div>

                <div className="strategy-options-grid">
                  {AVAILABLE_STRATEGIES.map(strategy => {
                    const isSelected = selectedStrategyId === strategy.id;
                    return (
                      <div
                        key={strategy.id}
                        className={`strategy-card ${isSelected ? 'strategy-card-selected' : ''}`}
                        onClick={() => setSelectedStrategyId(strategy.id)}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                      >
                        <div className="flex justify-between items-center">
                          <span className="strategy-title font-semibold text-sm">
                            {strategy.customerLabel}
                          </span>
                          <span className={`strategy-rate-badge ${strategy.rate > 0 ? 'badge-success' : 'badge-neutral'}`}>
                            {Math.round(strategy.rate * 100)}% Off
                          </span>
                        </div>
                        <p className="strategy-desc">{strategy.description}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="pattern-note mt-2">
                  <small>
                    🎯 <strong>Strategy Pattern:</strong> Calculates discount via <code>{activeStrategy.constructor.name}.calculateDiscount()</code> without conditionals.
                  </small>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            {cart.length > 0 && (
              <div className="checkout-summary-box p-3 bg-beige rounded-xl space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm text-success">
                  <span>
                    Discount ({activeStrategy.customerLabel} - {Math.round(activeStrategy.rate * 100)}%):
                  </span>
                  <span className="font-semibold">-{formatCurrency(discount)}</span>
                </div>

                <div className="divider my-1"></div>

                <div className="flex justify-between text-base font-bold text-primary">
                  <span>Final Total:</span>
                  <span className="text-xl font-mono">{formatCurrency(total)}</span>
                </div>
              </div>
            )}

            {/* Checkout Action Button */}
            <button
              type="button"
              className="btn-primary w-full py-3 text-base font-bold shadow-md flex items-center justify-center gap-2"
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              <Receipt size={18} />
              <span>Complete Sale ({formatCurrency(total)})</span>
            </button>
          </div>
        </div>
      ) : (
        /* ================= SALES HISTORY ================= */
        <div className="sales-history-view space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="section-title">Sales History</h3>
              <p className="text-xs text-muted">All recorded transactions</p>
            </div>
            <span className="badge badge-neutral">{sales.length} records</span>
          </div>

          <div className="search-bar-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input text-sm"
              placeholder="Search by Sale ID, customer, item..."
              value={salesSearch}
              onChange={e => setSalesSearch(e.target.value)}
            />
          </div>

          <div className="sales-history-list space-y-3">
            {filteredSales.length > 0 ? (
              filteredSales.map(sale => (
                <SaleCard
                  key={sale.id}
                  sale={sale}
                  onViewReceipt={onViewReceipt}
                />
              ))
            ) : (
              <div className="mobile-card empty-state-card text-center py-8">
                <span className="text-4xl mb-2 block">📋</span>
                <h4 className="font-semibold text-base mb-1">No Transactions Found</h4>
                <p className="text-xs text-muted">
                  {salesSearch ? `No sales match "${salesSearch}".` : 'No sales completed yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
