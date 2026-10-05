// ==========================================
// Jen's Pastry Shop - Baker Dashboard (Kitchen & Production)
// Section 9: Dashboard, Production Queue, Today's Orders, Ingredients, Low Stock, Production Summary, Logout
// ==========================================

import React, { useState, useEffect } from 'react';
import { useShop } from '../../hooks/useShop.js';
import { ROLES } from '../../constants/roles.js';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import NotificationToast from '../../components/NotificationToast.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { 
  Flame, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  ChefHat, 
  Sparkles, 
  Play, 
  CheckCircle2,
  Wheat,
  ListOrdered,
  Plus,
  Minus,
  Package,
  Search,
  Zap,
  Check
} from 'lucide-react';

export default function BakerDashboard() {
  const { products, sales, updateStock } = useShop();
  const [activeTab, setActiveTab] = useState('overview');

  // Shared production orders state
  const [productionOrders, setProductionOrders] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bakeology_sales') || '[]');
      const source = stored.length > 0 ? stored : sales;
      // Ensure all have valid status
      return source.map(o => ({
        ...o,
        orderStatus: o.orderStatus || 'Pending'
      }));
    } catch {
      return sales.map(o => ({ ...o, orderStatus: o.orderStatus || 'Pending' }));
    }
  });

  const PREP_DURATION = 20; // 20 seconds preparation timer

  // Track start times for preparing orders
  const [prepTimers, setPrepTimers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bakeology_prep_timers') || '{}');
    } catch {
      return {};
    }
  });

  const [currentTime, setCurrentTime] = useState(Date.now());

  // Baker status transitions: Pending -> Preparing -> Ready for Pickup
  const handleAdvanceStatus = (orderId, targetStatus) => {
    setProductionOrders(prev => {
      const updated = prev.map(order => {
        if (order.id === orderId || order.saleNumber === orderId) {
          return { ...order, orderStatus: targetStatus };
        }
        return order;
      });
      localStorage.setItem('bakeology_sales', JSON.stringify(updated));
      return updated;
    });

    // Also update any customer orders in localStorage and notify listeners
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bakeology_customer_orders_')) {
          const custOrders = JSON.parse(localStorage.getItem(key) || '[]');
          let changed = false;
          const updatedCustOrders = custOrders.map(o => {
            if (o.id === orderId || o.saleNumber === orderId) {
              changed = true;
              return { ...o, orderStatus: targetStatus };
            }
            return o;
          });
          if (changed) {
            localStorage.setItem(key, JSON.stringify(updatedCustOrders));
          }
        }
      }
      window.dispatchEvent(new CustomEvent('bakeology_order_updated', { detail: { orderId, targetStatus } }));
    } catch (e) {
      console.warn("Could not sync customer orders on status advance:", e);
    }
  };

  // Start 20-second timer when Baker starts preparing
  const handleStartPreparing = (orderId) => {
    const startTime = Date.now();
    setPrepTimers(prev => {
      const next = { ...prev, [orderId]: startTime };
      localStorage.setItem('bakeology_prep_timers', JSON.stringify(next));
      return next;
    });
    handleAdvanceStatus(orderId, 'Preparing');
  };

  // Allow immediate completion if needed
  const handleMarkDoneImmediately = (orderId) => {
    setPrepTimers(prev => {
      const next = { ...prev };
      delete next[orderId];
      localStorage.setItem('bakeology_prep_timers', JSON.stringify(next));
      return next;
    });
    handleAdvanceStatus(orderId, 'Ready for Pickup');
  };

  // Helper to get remaining countdown seconds (20 -> 0)
  const getOrderRemainingSeconds = (order) => {
    const key = order.id || order.saleNumber;
    const startTime = prepTimers[key] || prepTimers[order.id] || prepTimers[order.saleNumber];
    if (!startTime) return PREP_DURATION;
    const elapsed = Math.floor((currentTime - startTime) / 1000);
    return Math.max(0, PREP_DURATION - elapsed);
  };

  // Auto-initialize timer for any existing preparing orders without timer
  useEffect(() => {
    const preparing = productionOrders.filter(o => o.orderStatus === 'Preparing');
    if (preparing.length > 0) {
      setPrepTimers(prev => {
        let changed = false;
        const next = { ...prev };
        preparing.forEach(o => {
          const key = o.id || o.saleNumber;
          if (!next[key]) {
            next[key] = Date.now();
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('bakeology_prep_timers', JSON.stringify(next));
        }
        return changed ? next : prev;
      });
    }
  }, [productionOrders]);

  // Main 20s countdown ticker: when time hits zero, automatically turns into Done
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      // Check all preparing orders to auto-advance when 20s expires
      setProductionOrders(prevOrders => {
        let hasChanges = false;
        const updatedOrders = prevOrders.map(order => {
          if (order.orderStatus === 'Preparing') {
            const key = order.id || order.saleNumber;
            const startTime = prepTimers[key] || prepTimers[order.id] || prepTimers[order.saleNumber];
            if (startTime) {
              const elapsedSec = (now - startTime) / 1000;
              if (elapsedSec >= PREP_DURATION) {
                // Timer reached 0: Automatically turn into Done (Ready for Pickup)
                hasChanges = true;
                return { ...order, orderStatus: 'Ready for Pickup' };
              }
            }
          }
          return order;
        });

        if (hasChanges) {
          localStorage.setItem('bakeology_sales', JSON.stringify(updatedOrders));
          
          // Also sync customer orders in localStorage
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith('bakeology_customer_orders_')) {
                const custOrders = JSON.parse(localStorage.getItem(k) || '[]');
                let custChanged = false;
                const updatedCust = custOrders.map(co => {
                  const matching = updatedOrders.find(uo => uo.id === co.id || uo.saleNumber === co.saleNumber);
                  if (matching && matching.orderStatus !== co.orderStatus) {
                    custChanged = true;
                    return { ...co, orderStatus: matching.orderStatus };
                  }
                  return co;
                });
                if (custChanged) {
                  localStorage.setItem(k, JSON.stringify(updatedCust));
                }
              }
            }
            window.dispatchEvent(new CustomEvent('bakeology_order_updated', { detail: { autoDone: true } }));
          } catch (e) {
            console.warn("Could not sync customer orders on auto-done:", e);
          }
          return updatedOrders;
        }
        return prevOrders;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [prepTimers]);

  // Metrics
  const pendingOrders = productionOrders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed');
  const preparingOrders = productionOrders.filter(o => o.orderStatus === 'Preparing');
  const readyOrders = productionOrders.filter(o => o.orderStatus === 'Ready for Pickup' || o.orderStatus === 'Done');
  const completedOrders = productionOrders.filter(o => o.orderStatus === 'Completed');
  const totalItemsToBake = productionOrders
    .filter(o => o.orderStatus !== 'Completed')
    .reduce((sum, o) => sum + (o.items?.reduce((isum, item) => isum + item.quantity, 0) || 0), 0);

  // Grouped items needed today
  const itemsNeededMap = {};
  productionOrders.forEach(order => {
    order.items?.forEach(item => {
      itemsNeededMap[item.name] = (itemsNeededMap[item.name] || 0) + item.quantity;
    });
  });

  // Toast notification feedback
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Low stock replenishment state & filters
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockFilterCategory, setStockFilterCategory] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(true);
  const [customAddQtys, setCustomAddQtys] = useState({});

  const getCustomQty = (productId) => customAddQtys[productId] ?? 12;
  const setCustomQty = (productId, val) => {
    setCustomAddQtys(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(100, Number(val) || 1))
    }));
  };

  const handleAddStock = (productId, amountToAdd) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const current = Number(product.stock) || 0;
    const newStock = Math.max(0, current + Number(amountToAdd));
    updateStock(productId, newStock);
    showToast(`Fresh batch baked! Added +${amountToAdd} to ${product.name} (Now: ${newStock} units)`, 'success');
  };

  const handleRestockAllLowStock = () => {
    if (lowStockProducts.length === 0) return;
    let count = 0;
    lowStockProducts.forEach(p => {
      const current = Number(p.stock) || 0;
      updateStock(p.id, current + 12);
      count++;
    });
    showToast(`Oven batch complete! Added +12 units to all ${count} low-stock pastries! 🥐`, 'success');
  };

  // Sample Bakery Ingredients Stock with localStorage persistence
  const [ingredients, setIngredients] = useState(() => {
    try {
      const stored = localStorage.getItem('bakeology_ingredients');
      return stored ? JSON.parse(stored) : [
        { name: 'All-Purpose Flour', quantity: 45, unit: 'kg', status: 'Good' },
        { name: 'Granulated Sugar', quantity: 22, unit: 'kg', status: 'Good' },
        { name: 'Pure Unsalted Butter', quantity: 8, unit: 'kg', status: 'Low' },
        { name: 'Fresh Farm Eggs', quantity: 36, unit: 'pcs', status: 'Low' },
        { name: 'Active Dry Yeast', quantity: 4.5, unit: 'kg', status: 'Good' },
        { name: 'Fresh Whole Milk', quantity: 18, unit: 'L', status: 'Good' },
        { name: 'Dutch Cocoa Powder', quantity: 6, unit: 'kg', status: 'Good' },
        { name: 'Pure Vanilla Extract', quantity: 1.2, unit: 'L', status: 'Good' }
      ];
    } catch {
      return [
        { name: 'All-Purpose Flour', quantity: 45, unit: 'kg', status: 'Good' },
        { name: 'Granulated Sugar', quantity: 22, unit: 'kg', status: 'Good' },
        { name: 'Pure Unsalted Butter', quantity: 8, unit: 'kg', status: 'Low' },
        { name: 'Fresh Farm Eggs', quantity: 36, unit: 'pcs', status: 'Low' },
        { name: 'Active Dry Yeast', quantity: 4.5, unit: 'kg', status: 'Good' },
        { name: 'Fresh Whole Milk', quantity: 18, unit: 'L', status: 'Good' },
        { name: 'Dutch Cocoa Powder', quantity: 6, unit: 'kg', status: 'Good' },
        { name: 'Pure Vanilla Extract', quantity: 1.2, unit: 'L', status: 'Good' }
      ];
    }
  });

  const handleRestockIngredient = (name, amount) => {
    setIngredients(prev => {
      const updated = prev.map(ing => {
        if (ing.name === name) {
          const newQty = Math.round((ing.quantity + amount) * 10) / 10;
          return {
            ...ing,
            quantity: newQty,
            status: (name === 'Fresh Farm Eggs' && newQty >= 40) || (name !== 'Fresh Farm Eggs' && newQty >= 10) ? 'Good' : 'Low'
          };
        }
        return ing;
      });
      localStorage.setItem('bakeology_ingredients', JSON.stringify(updated));
      return updated;
    });
    showToast(`Ingredient replenished: +${amount} to ${name}!`, 'success');
  };

  const lowStockProducts = products.filter(p => p.stock <= 10);

  const displayedStockProducts = products.filter(p => {
    const matchesSearch = !stockSearchQuery.trim() || p.name.toLowerCase().includes(stockSearchQuery.toLowerCase());
    const matchesCategory = stockFilterCategory === 'All' || (p.category && p.category.toLowerCase() === stockFilterCategory.toLowerCase());
    const matchesLowStock = !showLowStockOnly || p.stock <= 10;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Flame },
    { id: 'queue', label: 'Production Queue', icon: Clock, badge: (pendingOrders.length + preparingOrders.length) || undefined },
    { id: 'today-orders', label: "Today's Orders", icon: ListOrdered },
    { id: 'ingredients', label: 'Ingredients', icon: Wheat },
    { id: 'low-stock', label: 'Low Stock', icon: AlertTriangle, badge: lowStockProducts.length > 0 ? lowStockProducts.length : undefined },
    { id: 'summary', label: 'Production Summary', icon: Layers }
  ];

  return (
    <DashboardLayout
      role={ROLES.BAKER}
      title={
        activeTab === 'overview' ? 'Baker Station & Oven Overview' :
        activeTab === 'queue' ? 'Live Bakery Production Queue' :
        activeTab === 'today-orders' ? "Today's Baking Requirements" :
        activeTab === 'ingredients' ? 'Bakery Raw Ingredients & Restock' :
        activeTab === 'low-stock' ? 'Bakery Inventory & Counter Restock' :
        'Daily Baking Production Summary'
      }
      subtitle={
        activeTab === 'overview' ? 'Real-time baking orders, batch quantities, and oven status' :
        activeTab === 'queue' ? 'Start baking orders and mark hot batches as ready for counter' :
        activeTab === 'today-orders' ? 'Aggregated quantities of pastries required for current shift' :
        activeTab === 'ingredients' ? 'Monitor and replenish dough, butter, and pantry supplies' :
        activeTab === 'low-stock' ? 'Bake fresh batches, replenish display trays, and manage stock levels' :
        'Completed loaves, cakes, and pastry tallies'
      }
      navigationItems={navItems}
      activeItem={activeTab}
      onSelectItem={setActiveTab}
      headerActions={
        activeTab === 'low-stock' && lowStockProducts.length > 0 ? (
          <button
            type="button"
            className="btn-primary py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            onClick={handleRestockAllLowStock}
          >
            <Zap size={14} className="text-amber-300 fill-amber-300" />
            <span>Restock All Low ({lowStockProducts.length})</span>
          </button>
        ) : activeTab !== 'queue' && (pendingOrders.length + preparingOrders.length) > 0 ? (
          <button
            type="button"
            className="btn-primary py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            onClick={() => setActiveTab('queue')}
          >
            <Clock size={14} />
            <span>Active Queue ({pendingOrders.length + preparingOrders.length})</span>
          </button>
        ) : null
      }
    >
      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Key Baking Status Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs font-bold text-muted block uppercase">Items to Bake</span>
              <span className="text-xl font-extrabold text-primary block mt-1">{totalItemsToBake}</span>
              <span className="text-2xs text-muted block mt-0.5">Pastries needed</span>
            </div>

            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs font-bold text-muted block uppercase">Pending</span>
              <span className="text-xl font-extrabold text-amber-600 block mt-1">{pendingOrders.length}</span>
              <span className="text-2xs text-amber-700 block mt-0.5">Awaiting Oven</span>
            </div>

            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs font-bold text-muted block uppercase">Preparing</span>
              <span className="text-xl font-extrabold text-blue-600 block mt-1">{preparingOrders.length}</span>
              <span className="text-2xs text-blue-700 block mt-0.5">In Oven / Mixing</span>
            </div>

            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs font-bold text-muted block uppercase">Ready</span>
              <span className="text-xl font-extrabold text-green-600 block mt-1">{readyOrders.length}</span>
              <span className="text-2xs text-green-700 block mt-0.5">At Counter</span>
            </div>

            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs font-bold text-muted block uppercase">Completed</span>
              <span className="text-xl font-extrabold text-text-primary block mt-1">{completedOrders.length}</span>
              <span className="text-2xs text-muted block mt-0.5">Picked Up</span>
            </div>
          </div>

          {/* Urgent Queue Callout */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 rounded-2xl text-white shadow-md flex justify-between items-center">
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block mb-1">
                Bakery Kitchen Queue
              </span>
              <h3 className="font-bold text-base font-serif">
                {preparingOrders.length > 0 ? `${preparingOrders.length} Order(s) Currently Baking` : 'Ready to Start Next Batch'}
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">Check order tickets and dispatch hot batches as soon as ready.</p>
            </div>
            <button
              type="button"
              className="bg-white text-amber-800 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-cream transition-all flex items-center gap-1.5"
              onClick={() => setActiveTab('queue')}
            >
              <span>Open Queue</span>
              <ChefHat size={14} />
            </button>
          </div>

          {/* Quick Production Preview */}
          <div className="bg-card rounded-xl border border-border-light p-4 shadow-2xs space-y-2">
            <h3 className="font-bold text-xs text-primary">Active Queue Highlights</h3>
            <div className="space-y-2">
              {preparingOrders.length === 0 && pendingOrders.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted">
                  No orders currently in the kitchen queue.
                </div>
              ) : (
                [...preparingOrders, ...pendingOrders].slice(0, 3).map(order => (
                  <div key={order.id} className="p-3 rounded-xl bg-cream-pure border border-border-light flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-primary block">ORDER #{order.saleNumber}</span>
                      <span className="text-2xs text-muted">
                        {order.items?.map(it => `${it.name} × ${it.quantity}`).join(', ')}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-2xs font-extrabold ${
                      order.orderStatus === 'Preparing' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.orderStatus === 'Preparing' ? `Preparing (${getOrderRemainingSeconds(order)}s)` : order.orderStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCTION QUEUE TAB */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xs text-primary">Live Production Queue ({pendingOrders.length + preparingOrders.length} active)</h3>
            <span className="text-2xs text-muted">Advance status as you bake</span>
          </div>

          {productionOrders.filter(o => o.orderStatus !== 'Completed').length === 0 ? (
            <div className="p-8 text-center text-xs text-muted bg-card rounded-xl border border-border-light">
              No pending orders in the kitchen production queue. Hot baked pastries will appear here as orders arrive.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {productionOrders.filter(o => o.orderStatus !== 'Completed').map(order => {
                const isPreparing = order.orderStatus === 'Preparing';
                const isReady = order.orderStatus === 'Ready for Pickup' || order.orderStatus === 'Done';
                const remainingSeconds = isPreparing ? getOrderRemainingSeconds(order) : 0;

                return (
                  <div key={order.id} className="bg-card p-4 rounded-xl border border-border-light shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start border-b border-border-light pb-2">
                      <div>
                        <span className="font-bold text-sm text-primary block">ORDER #{order.saleNumber}</span>
                        <span className="text-2xs text-muted">Placed: {formatDate(order.date)}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-2xs font-extrabold border transition-all ${
                        isReady ? 'bg-green-100 text-green-700 border-green-300' :
                        isPreparing ? 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {isReady ? 'Done' : isPreparing ? `Preparing (${remainingSeconds}s)` : order.orderStatus}
                      </span>
                    </div>

                    {/* Pastry Items List */}
                    <div className="my-2.5 space-y-1.5">
                      {order.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-cream-pure rounded-lg">
                          <span className="font-semibold text-text-primary">{it.name}</span>
                          <span className="font-extrabold text-primary px-2 py-0.5 bg-pink-100 rounded text-2xs">
                            × {it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Baker Action Buttons */}
                  <div className="pt-2 border-t border-border-light">
                    {!isPreparing && !isReady && (
                      <button
                        type="button"
                        className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        onClick={() => handleStartPreparing(order.id)}
                      >
                        <Play size={14} />
                        <span>Start Preparing</span>
                      </button>
                    )}

                    {isPreparing && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/80 border border-blue-200 shadow-2xs space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-blue-900">
                            <Flame size={15} className="text-amber-500 animate-bounce" />
                            <span>Baking in Oven</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-mono font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                            <Clock size={12} className="animate-spin text-blue-600" />
                            <span>{remainingSeconds}s remaining</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-blue-200/70 h-2.5 rounded-full overflow-hidden p-0.5">
                          <div
                            className="bg-gradient-to-r from-blue-500 via-amber-500 to-green-500 h-full rounded-full transition-all duration-500 ease-linear shadow-xs"
                            style={{ width: `${((PREP_DURATION - remainingSeconds) / PREP_DURATION) * 100}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center pt-0.5">
                          <span className="text-3xs text-blue-700/80 font-medium">
                            Turns into Done when timer reaches 0s
                          </span>
                          <button
                            type="button"
                            className="text-3xs font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-0.5 cursor-pointer"
                            onClick={() => handleMarkDoneImmediately(order.id)}
                          >
                            <span>Skip to Done</span>
                            <CheckCircle2 size={11} />
                          </button>
                        </div>
                      </div>
                    )}

                    {isReady && (
                      <div className="p-3 bg-green-50 rounded-xl text-center text-xs font-bold text-green-700 border border-green-200 flex items-center justify-center gap-2 shadow-2xs">
                        <CheckCircle size={16} className="text-green-600" />
                        <span>Done — Ready for Pickup at Counter</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* 3. TODAY'S ORDERS TAB */}
      {activeTab === 'today-orders' && (
        <div className="space-y-3 max-w-xl mx-auto">
          <div className="bg-card p-4 rounded-xl border border-border-light space-y-3 shadow-2xs">
            <h3 className="font-bold text-xs text-primary">Aggregated Daily Pastry Requirements</h3>
            <p className="text-2xs text-muted">Total quantities of each pastry needed for today's orders:</p>

            <div className="divide-y divide-border-light">
              {Object.keys(itemsNeededMap).length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">
                  No active orders requiring baking at this time.
                </div>
              ) : (
                Object.entries(itemsNeededMap).map(([name, qty]) => (
                  <div key={name} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-primary">{name}</span>
                    <span className="font-extrabold text-sm text-primary px-3 py-0.5 bg-pink-100 rounded-lg">
                      {qty} required
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. INGREDIENTS TAB */}
      {activeTab === 'ingredients' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs text-primary flex items-center gap-1.5">
                <Wheat size={16} className="text-amber-600" />
                <span>Bakery Raw Ingredients & Pantry Inventory</span>
              </h3>
              <p className="text-3xs text-muted">Monitor and restock dough, butter, eggs, and sugars</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {ingredients.map(ing => (
              <div key={ing.name} className="bg-card p-3.5 rounded-2xl border border-border-light space-y-2.5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-text-primary leading-tight">{ing.name}</span>
                    <span className={`text-3xs px-2 py-0.5 rounded-full font-black border ${
                      ing.status === 'Low' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'
                    }`}>
                      {ing.status}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border-light flex justify-between text-xs mt-2">
                    <span className="text-muted text-3xs font-bold">In Stock:</span>
                    <span className="font-black text-primary">{ing.quantity} {ing.unit}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    className="py-1 px-1 rounded-lg bg-cream-pure border border-border-medium hover:border-primary text-3xs font-black text-primary transition-all flex items-center justify-center gap-0.5 cursor-pointer shadow-2xs"
                    onClick={() => handleRestockIngredient(ing.name, ing.unit === 'pcs' ? 12 : 5)}
                  >
                    <Plus size={10} />
                    <span>+{ing.unit === 'pcs' ? '12 pcs' : '5 ' + ing.unit}</span>
                  </button>
                  <button
                    type="button"
                    className="py-1 px-1 rounded-lg bg-cream-pure border border-border-medium hover:border-primary text-3xs font-black text-primary transition-all flex items-center justify-center gap-0.5 cursor-pointer shadow-2xs"
                    onClick={() => handleRestockIngredient(ing.name, ing.unit === 'pcs' ? 30 : 15)}
                  >
                    <Plus size={10} />
                    <span>+{ing.unit === 'pcs' ? '30 pcs' : '15 ' + ing.unit}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LOW STOCK & INVENTORY REPLENISHMENT TAB */}
      {activeTab === 'low-stock' && (
        <div className="space-y-4">
          {/* Top Hero Replenishment Card */}
          <div className="bg-gradient-to-r from-primary to-pink-900 p-5 rounded-2xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-2xs font-extrabold uppercase tracking-widest text-pink-200 bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                Oven Production & Counter Restock
              </span>
              <h2 className="text-lg font-black font-serif tracking-tight">
                {lowStockProducts.length > 0 ? `${lowStockProducts.length} Pastries Require Oven Restock` : 'All Pastry Trays Are Fully Stocked!'}
              </h2>
              <p className="text-xs text-pink-100 max-w-xl leading-relaxed">
                Bake and replenish freshly prepared loaves, delicate cakes, and pastries directly to the counter to keep customer trays full.
              </p>
            </div>

            {lowStockProducts.length > 0 ? (
              <button
                type="button"
                className="bg-white text-primary px-4 py-2.5 rounded-xl text-xs font-black shadow-md hover:bg-cream transition-all flex items-center gap-2 cursor-pointer shrink-0"
                onClick={handleRestockAllLowStock}
              >
                <Zap size={16} className="text-amber-500 fill-amber-500" />
                <span>Bake & Restock All (+12 Each)</span>
              </button>
            ) : (
              <div className="bg-white/20 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-white shrink-0">
                <CheckCircle size={16} className="text-green-300" />
                <span>Counter Trays Fully Stocked</span>
              </div>
            )}
          </div>

          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-muted block">Low Stock Alerts</span>
              <span className="text-xl font-black text-amber-600 block mt-0.5">{lowStockProducts.length}</span>
              <span className="text-3xs text-muted block mt-0.5">&le; 10 units left</span>
            </div>

            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-muted block">Out of Stock</span>
              <span className="text-xl font-black text-danger block mt-0.5">{products.filter(p => p.stock === 0).length}</span>
              <span className="text-3xs text-muted block mt-0.5">Sold out / critical</span>
            </div>

            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-muted block">Healthy Trays</span>
              <span className="text-xl font-black text-success block mt-0.5">{products.filter(p => p.stock > 10).length}</span>
              <span className="text-3xs text-muted block mt-0.5">&gt; 10 units available</span>
            </div>

            <div className="bg-card p-3 rounded-xl border border-border-light shadow-2xs">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-muted block">Total Finished Stock</span>
              <span className="text-xl font-black text-primary block mt-0.5">{products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0)}</span>
              <span className="text-3xs text-muted block mt-0.5">Units in display</span>
            </div>
          </div>

          {/* Search, Filter Mode & Category Controls */}
          <div className="bg-card p-3.5 rounded-2xl border border-border-light shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search pastry by name to add stock..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border-medium text-xs bg-cream-pure focus:bg-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* View Toggle: Only Low vs All */}
              <div className="flex rounded-xl p-0.5 bg-cream-pure border border-border-light shrink-0">
                <button
                  type="button"
                  className={`px-3 py-1 text-2xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    showLowStockOnly 
                      ? 'bg-amber-500 text-white shadow-2xs' 
                      : 'text-muted hover:text-primary'
                  }`}
                  onClick={() => setShowLowStockOnly(true)}
                >
                  Low Stock Only ({lowStockProducts.length})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 text-2xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    !showLowStockOnly 
                      ? 'bg-primary text-white shadow-2xs' 
                      : 'text-muted hover:text-primary'
                  }`}
                  onClick={() => setShowLowStockOnly(false)}
                >
                  All Pastries ({products.length})
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {['All', 'Bread', 'Cake', 'Pastry', 'Beverage', 'Dessert'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`px-3 py-1 rounded-full text-2xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    stockFilterCategory === cat
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-white text-muted border border-border-light hover:border-primary'
                  }`}
                  onClick={() => setStockFilterCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pastries Restock Grid */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs text-primary flex items-center gap-1.5">
                <Package size={15} className="text-primary" />
                <span>Pastry Counter Trays ({displayedStockProducts.length})</span>
              </h3>
              <span className="text-3xs text-muted">Tap quick batch or enter custom amount to add stock</span>
            </div>

            {displayedStockProducts.length === 0 ? (
              <div className="bg-card p-10 rounded-2xl border border-dashed border-border-medium text-center space-y-2">
                <CheckCircle size={32} className="mx-auto text-success" />
                <h4 className="font-bold text-sm text-primary">No pastries matching filter</h4>
                <p className="text-xs text-muted">All pastries in this view have healthy stock levels above 10 units.</p>
                <button
                  type="button"
                  className="btn-secondary py-1.5 px-3 text-xs font-bold rounded-xl mt-2 cursor-pointer"
                  onClick={() => {
                    setShowLowStockOnly(false);
                    setStockFilterCategory('All');
                    setStockSearchQuery('');
                  }}
                >
                  Show All Pastries
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedStockProducts.map(p => {
                  const isOutOfStock = p.stock === 0;
                  const isCritical = p.stock > 0 && p.stock <= 5;
                  const isLow = p.stock > 5 && p.stock <= 10;
                  const currentCustomQty = getCustomQty(p.id);
                  const progressPct = Math.min(100, Math.round((p.stock / 50) * 100));

                  return (
                    <div 
                      key={p.id} 
                      className={`bg-card p-3.5 rounded-2xl border transition-all shadow-2xs space-y-3 flex flex-col justify-between ${
                        isOutOfStock ? 'border-red-300 bg-red-50/20' :
                        isCritical ? 'border-amber-300 bg-amber-50/20' :
                        'border-border-light hover:border-border-medium'
                      }`}
                    >
                      <div>
                        {/* Top Card Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-pink-50 border border-border-light flex items-center justify-center shrink-0">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-7 h-7 object-contain" />
                              ) : (
                                <span className="text-xl">{p.icon || '🥐'}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-primary leading-tight">{p.name}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-primary">
                                  {p.category}
                                </span>
                                <span className="text-3xs text-muted font-bold">
                                  {formatCurrency(p.price)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 rounded-full text-3xs font-black border ${
                            isOutOfStock ? 'bg-red-100 text-red-700 border-red-300' :
                            isCritical ? 'bg-red-100 text-red-700 border-red-300' :
                            isLow ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            'bg-green-100 text-green-800 border-green-300'
                          }`}>
                            {isOutOfStock ? 'Sold Out' : isCritical ? `Critical (${p.stock})` : isLow ? `${p.stock} left` : `${p.stock} units`}
                          </span>
                        </div>

                        {/* Stock Capacity Progress Bar */}
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-3xs font-bold text-muted">
                            <span>Counter Display Level</span>
                            <span>{p.stock} / 50 units</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-border-light">
                            <div 
                              className={`h-full transition-all duration-300 rounded-full ${
                                isOutOfStock ? 'bg-red-500 w-0' :
                                isCritical ? 'bg-red-500' :
                                isLow ? 'bg-amber-500' :
                                'bg-green-600'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Replenish Actions */}
                      <div className="pt-2 border-t border-border-light space-y-2">
                        {/* Quick Preset Buttons */}
                        <div>
                          <span className="text-3xs font-bold text-muted uppercase tracking-wider block mb-1">Quick Batch Bake:</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              className="py-1 px-1.5 rounded-lg border border-border-medium bg-cream-pure hover:bg-pink-100 text-3xs font-black text-primary transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                              onClick={() => handleAddStock(p.id, 6)}
                              title="Bake half dozen"
                            >
                              <Plus size={10} />
                              <span>6 pcs</span>
                            </button>

                            <button
                              type="button"
                              className="py-1 px-1.5 rounded-lg border border-border-medium bg-cream-pure hover:bg-pink-100 text-3xs font-black text-primary transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                              onClick={() => handleAddStock(p.id, 12)}
                              title="Bake 1 dozen batch"
                            >
                              <Plus size={10} />
                              <span>12 pcs</span>
                            </button>

                            <button
                              type="button"
                              className="py-1 px-1.5 rounded-lg border border-border-medium bg-cream-pure hover:bg-pink-100 text-3xs font-black text-primary transition-all flex items-center justify-center gap-0.5 cursor-pointer"
                              onClick={() => handleAddStock(p.id, 24)}
                              title="Bake full tray"
                            >
                              <Plus size={10} />
                              <span>24 pcs</span>
                            </button>
                          </div>
                        </div>

                        {/* Custom Counter & Add Stock Button */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <div className="flex items-center border border-border-medium rounded-lg bg-white overflow-hidden shadow-2xs shrink-0">
                            <button
                              type="button"
                              className="px-2 py-1 text-primary hover:bg-pink-50 transition-colors disabled:opacity-30 cursor-pointer"
                              onClick={() => setCustomQty(p.id, currentCustomQty - 1)}
                              disabled={currentCustomQty <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="px-2 py-0.5 text-2xs font-black text-primary min-w-[24px] text-center">
                              {currentCustomQty}
                            </span>
                            <button
                              type="button"
                              className="px-2 py-1 text-primary hover:bg-pink-50 transition-colors cursor-pointer"
                              onClick={() => setCustomQty(p.id, currentCustomQty + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="btn-primary py-1 px-2.5 rounded-lg text-2xs font-extrabold flex-1 flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                            onClick={() => handleAddStock(p.id, currentCustomQty)}
                          >
                            <ChefHat size={12} />
                            <span>Add Stock</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Raw Ingredients Restock Box */}
          <div className="bg-card p-4 rounded-2xl border border-border-light space-y-3 shadow-2xs mt-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <Wheat size={16} className="text-amber-600" />
                  <span>Bakery Raw Ingredients & Supplies</span>
                </h3>
                <p className="text-3xs text-muted">Keep baking supplies stocked to prevent kitchen production halts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {ingredients.map(ing => (
                <div key={ing.name} className="p-3 rounded-xl bg-cream-pure border border-border-light space-y-2 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-text-primary leading-tight">{ing.name}</span>
                    <span className={`text-3xs px-2 py-0.5 rounded-full font-black border ${
                      ing.status === 'Low' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'
                    }`}>
                      {ing.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-border-light">
                    <span className="text-3xs text-muted font-bold">In Stock:</span>
                    <span className="font-black text-primary">{ing.quantity} {ing.unit}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <button
                      type="button"
                      className="py-1 px-1 rounded-lg bg-white border border-border-medium hover:border-primary text-3xs font-black text-primary transition-all flex items-center justify-center gap-0.5 cursor-pointer shadow-2xs"
                      onClick={() => handleRestockIngredient(ing.name, ing.unit === 'pcs' ? 12 : 5)}
                    >
                      <Plus size={9} />
                      <span>+{ing.unit === 'pcs' ? '12 pcs' : '5 ' + ing.unit}</span>
                    </button>
                    <button
                      type="button"
                      className="py-1 px-1 rounded-lg bg-white border border-border-medium hover:border-primary text-3xs font-black text-primary transition-all flex items-center justify-center gap-0.5 cursor-pointer shadow-2xs"
                      onClick={() => handleRestockIngredient(ing.name, ing.unit === 'pcs' ? 30 : 15)}
                    >
                      <Plus size={9} />
                      <span>+{ing.unit === 'pcs' ? '30 pcs' : '15 ' + ing.unit}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. PRODUCTION SUMMARY TAB */}
      {activeTab === 'summary' && (
        <div className="space-y-4 max-w-md mx-auto">
          <div className="bg-card p-4 rounded-xl border border-border-light space-y-3 shadow-2xs">
            <h3 className="font-bold text-xs text-primary">Shift Production Tally</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border-light">
                <span className="text-muted">Total Batches Dispatched:</span>
                <span className="font-bold text-primary">{readyOrders.length + completedOrders.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-light">
                <span className="text-muted">Currently Baking in Oven:</span>
                <span className="font-bold text-blue-600">{preparingOrders.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-light">
                <span className="text-muted">Orders Awaiting Prep:</span>
                <span className="font-bold text-amber-600">{pendingOrders.length}</span>
              </div>
              <div className="flex justify-between py-1 font-extrabold text-sm text-primary pt-2 border-t border-border-medium">
                <span>Oven Efficiency:</span>
                <span className="text-success">Optimal (Baking Schedule On-Time)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Notification Toast Feedback */}
      <NotificationToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </DashboardLayout>
  );
}
