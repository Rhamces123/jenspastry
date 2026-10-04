// ==========================================
// Jen's Pastry Shop - Customer Dashboard
// Section 7: Home, Browse Products, Cart, My Orders, Order Tracking, Favorites, Notifications, My Account, Logout
// ==========================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { useShop } from '../../hooks/useShop.js';
import { ROLES } from '../../constants/roles.js';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import ReceiptModal from '../../components/ReceiptModal.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { isFirebaseConfigured, db } from '../../firebase.js';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { 
  Home, 
  ShoppingBag, 
  ShoppingCart, 
  Clock, 
  MapPin, 
  Heart, 
  Bell, 
  User, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  Search, 
  Sparkles, 
  ArrowRight,
  Package,
  Calendar,
  Croissant
} from 'lucide-react';

export default function CustomerDashboard() {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const { products, sales, completeSale } = useShop();

  const [activeTab, setActiveTab] = useState('home');
  const [cart, setCart] = useState([]);
  const [discountStrategyId, setDiscountStrategyId] = useState('regular');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`bakeology_favs_${currentUser?.uid}`) || '[]');
    } catch {
      return [];
    }
  });

  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [profileName, setProfileName] = useState(userProfile?.fullName || currentUser?.displayName || '');
  const [profileMessage, setProfileMessage] = useState('');

  const displayName = userProfile?.fullName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Pastry Lover';

  // Sync Customer Orders from Firestore & LocalStorage
  useEffect(() => {
    if (!currentUser) return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      const ordersKey = `bakeology_customer_orders_${currentUser.uid}`;
      const localOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');

      if (isFirebaseConfigured() && db) {
        try {
          const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
          const snapshot = await getDocs(q);
          const liveOrders = [];
          snapshot.forEach(doc => liveOrders.push({ id: doc.id, ...doc.data() }));
          
          // Merge live orders with local orders without duplicates
          const orderMap = new Map();
          [...liveOrders, ...localOrders].forEach(o => {
            const key = o.id || o.saleNumber;
            if (!orderMap.has(key)) orderMap.set(key, o);
          });
          const merged = Array.from(orderMap.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          setCustomerOrders(merged);
        } catch (e) {
          console.warn("Could not query Firestore orders:", e);
          setCustomerOrders(localOrders);
        }
      } else {
        setCustomerOrders(localOrders);
      }
      setOrdersLoading(false);
    };

    fetchOrders();
  }, [currentUser]);

  // Cart operations
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const next = item.quantity + delta;
        return next > 0 ? { ...item, quantity: next } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const toggleFavorite = (productId) => {
    setFavorites(prev => {
      const next = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
      if (currentUser) {
        localStorage.setItem(`bakeology_favs_${currentUser.uid}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountRate = discountStrategyId === 'student' ? 0.05 : discountStrategyId === 'bulk' ? 0.10 : 0;
  const cartDiscount = cartSubtotal * discountRate;
  const cartTotal = cartSubtotal - cartDiscount;

  // Checkout handling
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const recordedSale = completeSale(cart, 'Regular Customer', discountStrategyId);
      
      const orderRecord = {
        id: recordedSale.id,
        saleNumber: recordedSale.saleNumber,
        userId: currentUser?.uid,
        customerName: displayName,
        customerEmail: currentUser?.email || '',
        date: recordedSale.date,
        items: recordedSale.items,
        subtotal: recordedSale.subtotal,
        discount: recordedSale.discount,
        total: recordedSale.total,
        orderStatus: 'Confirmed'
      };

      // Persist to Firestore
      if (isFirebaseConfigured() && db) {
        try {
          await addDoc(collection(db, 'orders'), orderRecord);
        } catch (e) {
          console.warn("Could not sync order to Firestore:", e);
        }
      }

      // Persist to user's local orders
      const ordersKey = `bakeology_customer_orders_${currentUser.uid}`;
      const existing = JSON.parse(localStorage.getItem(ordersKey) || '[]');
      const updatedOrders = [orderRecord, ...existing];
      localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
      setCustomerOrders(updatedOrders);

      setCart([]);
      setActiveReceiptSale(recordedSale);
      setIsReceiptModalOpen(true);
      setActiveTab('orders');
    } catch (e) {
      alert("Checkout failed: " + (e.message || e));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    try {
      await updateUserProfile({ fullName: profileName.trim() });
      setProfileMessage("Profile updated successfully!");
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (e) {
      setProfileMessage("Update error: " + e.message);
    }
  };

  // Filtered Products
  const categories = ['All', 'Bread', 'Cake', 'Pastry', 'Beverage'];
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredProducts = products.slice(0, 4);
  const activeOrders = customerOrders.filter(o => ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup'].includes(o.orderStatus));

  // Navigation items for the sidebar
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'browse', label: 'Browse Pastries', icon: ShoppingBag, badge: products.length },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: totalCartCount > 0 ? totalCartCount : undefined },
    { id: 'orders', label: 'My Orders', icon: Clock, badge: customerOrders.length > 0 ? customerOrders.length : undefined },
    { id: 'tracking', label: 'Order Tracking', icon: MapPin, badge: activeOrders.length > 0 ? activeOrders.length : undefined },
    { id: 'favorites', label: 'Favorites', icon: Heart, badge: favorites.length > 0 ? favorites.length : undefined },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 2 },
    { id: 'account', label: 'My Account', icon: User }
  ];

  return (
    <DashboardLayout
      role={ROLES.CUSTOMER}
      title={
        activeTab === 'home' ? `Welcome, ${displayName}! 🥐` :
        activeTab === 'browse' ? 'Artisanal Pastry Menu' :
        activeTab === 'cart' ? 'Your Pastry Basket' :
        activeTab === 'orders' ? 'Your Order History' :
        activeTab === 'tracking' ? 'Live Order Tracking' :
        activeTab === 'favorites' ? 'Your Favorite Treats' :
        activeTab === 'notifications' ? 'Bakery Alerts & Updates' :
        'Customer Profile & Account'
      }
      subtitle={
        activeTab === 'home' ? 'Handcrafted breads & fresh pastries baked every morning' :
        activeTab === 'browse' ? 'Browse freshly baked loaves, delicate cakes, and hot beverages' :
        activeTab === 'cart' ? `${totalCartCount} item(s) in your tray` :
        activeTab === 'orders' ? 'Track order status and review receipts' :
        activeTab === 'tracking' ? 'Real-time bakery preparation pipeline' :
        activeTab === 'favorites' ? 'Quickly re-order your cherished bakery treats' :
        activeTab === 'notifications' ? 'Order readiness and pastry club rewards' :
        'Manage your account credentials'
      }
      navigationItems={navItems}
      activeItem={activeTab}
      onSelectItem={setActiveTab}
      headerActions={
        activeTab !== 'cart' && totalCartCount > 0 ? (
          <button
            type="button"
            className="btn-primary py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            onClick={() => setActiveTab('cart')}
          >
            <ShoppingCart size={14} />
            <span>Cart ({totalCartCount})</span>
          </button>
        ) : null
      }
    >
      {/* TAB 1: HOME OVERVIEW */}
      {activeTab === 'home' && (
        <div className="space-y-4">
          {/* Welcome Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-700 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-md">
              <span className="text-2xs font-extrabold uppercase tracking-widest text-pink-200 bg-white/20 px-2 py-0.5 rounded-full inline-block mb-2">
                Jen's Pastry Club Member
              </span>
              <h2 className="text-xl font-bold font-serif">
                Good day, {displayName}!
              </h2>
              <p className="text-xs text-pink-100 mt-1 leading-relaxed">
                Enjoy authentic artisanal pastries prepared fresh with pure butter and premium flour.
              </p>
              <button
                type="button"
                className="mt-3 bg-white text-primary px-4 py-2 rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 hover:bg-cream transition-all"
                onClick={() => setActiveTab('browse')}
              >
                <span>Browse Fresh Pastries</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs text-muted block">Active Orders</span>
              <span className="text-lg font-bold text-primary">{activeOrders.length}</span>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs text-muted block">Total Orders</span>
              <span className="text-lg font-bold text-text-primary">{customerOrders.length}</span>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs text-muted block">Saved Favorites</span>
              <span className="text-lg font-bold text-accent">{favorites.length}</span>
            </div>
            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs text-muted block">Items in Cart</span>
              <span className="text-lg font-bold text-success">{totalCartCount}</span>
            </div>
          </div>

          {/* Active Orders Quick Card */}
          {activeOrders.length > 0 && (
            <div className="bg-card p-3.5 rounded-xl border border-border-light shadow-2xs space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary" />
                  <span>Orders Currently in Progress ({activeOrders.length})</span>
                </h3>
                <button
                  type="button"
                  className="text-2xs text-primary font-bold hover:underline"
                  onClick={() => setActiveTab('tracking')}
                >
                  View Live Tracking →
                </button>
              </div>
              <div className="space-y-2">
                {activeOrders.map(order => (
                  <div key={order.id} className="p-2.5 rounded-lg bg-cream-pure border border-border-light flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-primary block">Order #{order.saleNumber}</span>
                      <span className="text-2xs text-muted">{order.items?.length || 0} pastry item(s)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                      {order.orderStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Pastries Grid */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs text-primary flex items-center gap-1.5">
                <Sparkles size={14} className="text-accent" />
                <span>Featured Pastries</span>
              </h3>
              <button
                type="button"
                className="text-2xs text-primary font-bold hover:underline"
                onClick={() => setActiveTab('browse')}
              >
                View Full Menu →
              </button>
            </div>

            {featuredProducts.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted bg-card rounded-xl border border-border-light">
                Our fresh pastry menu is being prepared. Check back shortly!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {featuredProducts.map(product => (
                  <div key={product.id} className="bg-card rounded-xl border border-border-light p-3 flex flex-col justify-between shadow-2xs">
                    <div>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-16 object-cover rounded-lg mb-1" />
                      ) : (
                        <div className="text-2xl text-center mb-1">{product.icon || '🥐'}</div>
                      )}
                      <h4 className="font-bold text-xs text-primary truncate text-center">{product.name}</h4>
                      <span className="text-2xs text-muted block text-center">{product.category}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border-light flex justify-between items-center">
                      <span className="font-bold text-xs text-primary">{formatCurrency(product.price)}</span>
                      <button
                        type="button"
                        className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-all"
                        onClick={() => addToCart(product)}
                        title="Add to Cart"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BROWSE PRODUCTS */}
      {activeTab === 'browse' && (
        <div className="space-y-3">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-muted" />
              <input
                type="text"
                placeholder="Search croissants, sourdough, cakes..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border-medium bg-card text-xs focus:border-primary"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-2xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-card text-muted border border-border-light hover:text-primary'
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted bg-card rounded-xl border border-border-light">
              No pastries available in the catalog yet.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bread: displayed as rows */}
              {filteredProducts.filter(p => p.category === 'Bread').length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Bread</h3>
                  <div className="space-y-2">
                    {filteredProducts.filter(p => p.category === 'Bread').map(product => {
                      const isFav = favorites.includes(product.id);
                      return (
                        <div key={product.id} className="bg-card rounded-xl border border-border-light p-3 flex items-center gap-3 shadow-2xs relative">
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-muted hover:text-red-500"
                            onClick={() => toggleFavorite(product.id)}
                            title={isFav ? "Remove favorite" : "Add to favorites"}
                          >
                            <Heart size={14} className={isFav ? "fill-red-500 text-red-500" : ""} />
                          </button>
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                          ) : (
                            <div className="text-xl shrink-0">{product.icon || '🥐'}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-primary truncate">{product.name}</h4>
                            <span className="text-2xs text-muted">Stock: {product.stock}</span>
                          </div>
                          <span className="font-bold text-sm text-primary">{formatCurrency(product.price)}</span>
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded-lg bg-primary text-white text-2xs font-bold flex items-center gap-1 hover:bg-primary-dark transition-all"
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                          >
                            <Plus size={11} />
                            <span>{product.stock <= 0 ? 'Out' : 'Add'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pastry, Cake & Dessert: displayed as 4-column grid */}
              {filteredProducts.filter(p => p.category !== 'Bread').length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Pastries</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {filteredProducts.filter(p => p.category !== 'Bread').map(product => {
                      const isFav = favorites.includes(product.id);
                      return (
                        <div key={product.id} className="bg-card rounded-xl border border-border-light p-3 flex flex-col justify-between shadow-2xs relative">
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-muted hover:text-red-500"
                            onClick={() => toggleFavorite(product.id)}
                            title={isFav ? "Remove favorite" : "Add to favorites"}
                          >
                            <Heart size={14} className={isFav ? "fill-red-500 text-red-500" : ""} />
                          </button>

                          <div>
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg mx-auto my-1" />
                            ) : (
                              <div className="text-2xl text-center my-1">{product.icon || '🥐'}</div>
                            )}
                            <span className="text-2xs text-muted block text-center">{product.category}</span>
                            <h4 className="font-bold text-xs text-primary truncate text-center">{product.name}</h4>
                            <span className="text-2xs font-semibold text-center block text-muted mt-0.5">
                              Stock: {product.stock}
                            </span>
                          </div>

                          <div className="mt-3 pt-2 border-t border-border-light flex justify-between items-center">
                            <span className="font-bold text-sm text-primary">{formatCurrency(product.price)}</span>
                            <button
                              type="button"
                              className="px-2.5 py-1 rounded-lg bg-primary text-white text-2xs font-bold flex items-center gap-1 hover:bg-primary-dark transition-all"
                              onClick={() => addToCart(product)}
                              disabled={product.stock <= 0}
                            >
                              <Plus size={11} />
                              <span>{product.stock <= 0 ? 'Out' : 'Add'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CART & CHECKOUT */}
      {activeTab === 'cart' && (
        <div className="space-y-4 max-w-xl mx-auto">
          {cart.length === 0 ? (
            <div className="bg-card p-8 rounded-2xl border border-border-light text-center space-y-3">
              <div className="w-12 h-12 bg-pink-100 text-primary rounded-full flex items-center justify-center mx-auto">
                <ShoppingCart size={24} />
              </div>
              <h3 className="font-bold text-sm text-primary">Your Pastry Basket is Empty</h3>
              <p className="text-xs text-muted max-w-xs mx-auto">
                Select your favorite croissants, artisan bread, or cakes to start your order.
              </p>
              <button
                type="button"
                className="btn-primary py-2 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                onClick={() => setActiveTab('browse')}
              >
                <Croissant size={14} />
                <span>Browse Menu</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Cart Items List */}
              <div className="bg-card rounded-2xl border border-border-light divide-y divide-border-light overflow-hidden shadow-2xs">
                {cart.map(item => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-lg shrink-0">
                        {item.icon || '🥐'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-primary truncate">{item.name}</h4>
                        <span className="text-2xs text-muted">{formatCurrency(item.price)} each</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-border-medium rounded-lg overflow-hidden bg-cream-pure">
                        <button
                          type="button"
                          className="px-2 py-1 text-muted hover:bg-beige"
                          onClick={() => updateCartQty(item.id, -1)}
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 py-0.5 text-xs font-bold text-primary min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-2 py-1 text-muted hover:bg-beige"
                          onClick={() => updateCartQty(item.id, 1)}
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <span className="font-bold text-xs text-primary min-w-[55px] text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </span>

                      <button
                        type="button"
                        className="text-muted hover:text-danger p-1"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Strategy Selector */}
              <div className="bg-card p-3 rounded-xl border border-border-light space-y-1.5 text-xs">
                <label className="font-bold text-primary block">Select Customer Discount Strategy:</label>
                <select
                  value={discountStrategyId}
                  onChange={e => setDiscountStrategyId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border-medium bg-cream-pure text-xs font-medium"
                >
                  <option value="regular">Regular Customer (0% Discount)</option>
                  <option value="student">Student / Senior Club (5% Discount)</option>
                  <option value="bulk">Bulk Pastry Order (10% Discount)</option>
                </select>
              </div>

              {/* Order Summary & Checkout */}
              <div className="bg-card p-4 rounded-xl border border-border-light space-y-2 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-success font-semibold">
                    <span>Discount Applied ({discountRate * 100}%):</span>
                    <span>-{formatCurrency(cartDiscount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border-light flex justify-between text-base font-extrabold text-primary">
                  <span>Total Due:</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>

                <button
                  type="button"
                  className="btn-primary w-full py-3 rounded-xl text-sm font-bold shadow-md mt-2 flex items-center justify-center gap-2"
                  onClick={handleCheckout}
                >
                  <CheckCircle size={16} />
                  <span>Place Customer Order ({formatCurrency(cartTotal)})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-3 max-w-xl mx-auto">
          {ordersLoading ? (
            <div className="p-8 text-center text-xs text-muted">Loading your pastry orders...</div>
          ) : customerOrders.length === 0 ? (
            <div className="bg-card p-8 rounded-2xl border border-border-light text-center space-y-3">
              <Package size={32} className="mx-auto text-muted" />
              <h3 className="font-bold text-sm text-primary">No Past Orders Yet</h3>
              <p className="text-xs text-muted">You haven't ordered yet. Browse our selection and treat yourself!</p>
              <button
                type="button"
                className="btn-primary py-2 px-4 rounded-xl text-xs font-bold shadow-sm"
                onClick={() => setActiveTab('browse')}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            customerOrders.map(order => (
              <div key={order.id} className="bg-card rounded-xl border border-border-light p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-sm text-primary block">Order #{order.saleNumber}</span>
                    <span className="text-2xs text-muted flex items-center gap-1 mt-0.5">
                      <Calendar size={11} />
                      {formatDate(order.date)}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-2xs font-extrabold border ${
                    order.orderStatus === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                    order.orderStatus === 'Ready for Pickup' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    order.orderStatus === 'Preparing' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    'bg-pink-100 text-primary border-border-light'
                  }`}>
                    {order.orderStatus || 'Confirmed'}
                  </span>
                </div>

                <div className="bg-cream-pure p-2.5 rounded-lg border border-border-light text-xs space-y-1">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-muted text-2xs">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-semibold text-text-primary">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-border-light flex justify-between font-bold text-xs text-primary">
                    <span>Total Amount</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: LIVE ORDER TRACKING */}
      {activeTab === 'tracking' && (
        <div className="space-y-4 max-w-xl mx-auto">
          {activeOrders.length === 0 ? (
            <div className="bg-card p-8 rounded-2xl border border-border-light text-center space-y-2">
              <CheckCircle size={32} className="text-success mx-auto" />
              <h3 className="font-bold text-sm text-primary">No Orders Currently in Preparation</h3>
              <p className="text-xs text-muted">All your past orders have been completed or picked up!</p>
            </div>
          ) : (
            activeOrders.map(order => {
              const statuses = ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed'];
              const currentIndex = statuses.indexOf(order.orderStatus || 'Confirmed');

              return (
                <div key={order.id} className="bg-card rounded-2xl border border-border-light p-4 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b border-border-light pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-primary">Order #{order.saleNumber} Tracking</h4>
                      <span className="text-2xs text-muted">{order.items?.length || 0} pastry items</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-2xs font-extrabold bg-pink-100 text-primary border border-border-light">
                      {order.orderStatus}
                    </span>
                  </div>

                  {/* Tracking Timeline */}
                  <div className="space-y-3">
                    {statuses.slice(0, 4).map((status, idx) => {
                      const isDone = idx <= currentIndex;
                      const isCurrent = idx === currentIndex;

                      return (
                        <div key={status} className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isDone ? 'bg-primary text-white shadow-xs' : 'bg-gray-100 text-muted'
                          }`}>
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <div className="flex-1">
                            <span className={`text-xs block font-bold ${isCurrent ? 'text-primary' : isDone ? 'text-text-primary' : 'text-muted'}`}>
                              {status === 'Pending' ? 'Order Received' :
                               status === 'Confirmed' ? 'Confirmed by Cashier' :
                               status === 'Preparing' ? 'Baking in Oven (Baker)' :
                               'Ready for Pickup at Counter'}
                            </span>
                            <span className="text-2xs text-muted">
                              {isCurrent ? 'Currently active stage' : isDone ? 'Completed' : 'Upcoming'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 6: FAVORITES */}
      {activeTab === 'favorites' && (
        <div className="space-y-3 max-w-xl mx-auto">
          {favorites.length === 0 ? (
            <div className="bg-card p-8 rounded-2xl border border-border-light text-center space-y-2">
              <Heart size={32} className="text-muted mx-auto" />
              <h3 className="font-bold text-sm text-primary">No Favorite Pastries Saved</h3>
              <p className="text-xs text-muted">Tap the heart icon on any pastry in the Browse tab to save it here for fast re-ordering.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.filter(p => favorites.includes(p.id)).map(product => (
                <div key={product.id} className="bg-card rounded-xl border border-border-light p-3 flex flex-col justify-between shadow-2xs">
                  <div>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="text-2xl text-center">{product.icon || '🥐'}</div>
                    )}
                    <h4 className="font-bold text-xs text-primary truncate text-center mt-1">{product.name}</h4>
                    <span className="text-2xs text-muted block text-center">{formatCurrency(product.price)}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-primary w-full py-1.5 rounded-lg text-2xs font-bold mt-2 flex items-center justify-center gap-1 shadow-2xs"
                    onClick={() => addToCart(product)}
                  >
                    <Plus size={11} />
                    <span>Add to Basket</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-2 max-w-xl mx-auto">
          <div className="bg-card p-3.5 rounded-xl border border-border-light flex gap-3 items-start shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-pink-100 text-primary flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-primary">Welcome to Jen's Pastry Shop!</h4>
              <p className="text-2xs text-muted mt-0.5">
                Thank you for signing in with Google. You can now browse pastries, track live orders, and enjoy customer discounts.
              </p>
              <span className="text-2xs text-muted font-mono block mt-1">Today</span>
            </div>
          </div>

          <div className="bg-card p-3.5 rounded-xl border border-border-light flex gap-3 items-start shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
              <Croissant size={16} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-primary">Fresh Morning Batch Ready</h4>
              <p className="text-2xs text-muted mt-0.5">
                Our bakers just pulled golden croissants and hot pandesal straight from the stone oven!
              </p>
              <span className="text-2xs text-muted font-mono block mt-1">Today</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: MY ACCOUNT */}
      {activeTab === 'account' && (
        <div className="space-y-4 max-w-md mx-auto">
          <div className="bg-card p-4 rounded-2xl border border-border-light space-y-3 shadow-2xs">
            <h3 className="font-bold text-xs text-primary">Customer Account Information</h3>

            {profileMessage && (
              <div className="p-2 bg-pink-50 border border-border-light rounded-lg text-2xs text-primary font-bold">
                {profileMessage}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="text-2xs font-bold text-muted block mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-xl border border-border-medium bg-cream-pure text-xs font-semibold"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-2xs font-bold text-muted block mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full p-2.5 rounded-xl border border-border-light bg-gray-100 text-xs text-muted font-mono"
                  value={currentUser?.email || ''}
                  disabled
                />
              </div>

              <div>
                <label className="text-2xs font-bold text-muted block mb-1">Assigned Role</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-xl border border-border-light bg-gray-100 text-xs text-primary font-bold capitalize"
                  value={userProfile?.role || 'customer'}
                  disabled
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                Save Profile Changes
              </button>
            </form>
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
