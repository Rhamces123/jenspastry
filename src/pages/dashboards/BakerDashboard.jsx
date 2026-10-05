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
  Check, 
  AlertOctagon, 
  X, 
  Boxes, 
  ArrowRight, 
  RotateCcw,
  PlusCircle,
  Tag
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

  // Default Bakery Raw Ingredients & Pantry Inventory Specifications
  const DEFAULT_INGREDIENTS = [
    { 
      id: 'ing-flour',
      name: 'All-Purpose Flour', 
      category: 'Flour & Grains',
      quantity: 45, 
      unit: 'kg', 
      targetCapacity: 100, 
      minThreshold: 20, 
      status: 'Good', 
      icon: '🌾',
      presets: [{ label: '10 kg Bag', amount: 10 }, { label: '25 kg Sack', amount: 25 }] 
    },
    { 
      id: 'ing-sugar',
      name: 'Granulated Sugar', 
      category: 'Sweeteners & Flavors',
      quantity: 22, 
      unit: 'kg', 
      targetCapacity: 50, 
      minThreshold: 15, 
      status: 'Good', 
      icon: '🍚',
      presets: [{ label: '10 kg Bag', amount: 10 }, { label: '25 kg Sack', amount: 25 }] 
    },
    { 
      id: 'ing-butter',
      name: 'Pure Unsalted Butter', 
      category: 'Dairy & Eggs',
      quantity: 8, 
      unit: 'kg', 
      targetCapacity: 25, 
      minThreshold: 10, 
      status: 'Low', 
      icon: '🧈',
      presets: [{ label: '5 kg Block', amount: 5 }, { label: '10 kg Case', amount: 10 }] 
    },
    { 
      id: 'ing-eggs',
      name: 'Fresh Farm Eggs', 
      category: 'Dairy & Eggs',
      quantity: 36, 
      unit: 'pcs', 
      targetCapacity: 90, 
      minThreshold: 40, 
      status: 'Low', 
      icon: '🥚',
      presets: [{ label: '12 pcs (1 Doz)', amount: 12 }, { label: '30 pcs (Tray)', amount: 30 }] 
    },
    { 
      id: 'ing-yeast',
      name: 'Active Dry Yeast', 
      category: 'Leavening & Yeast',
      quantity: 4.5, 
      unit: 'kg', 
      targetCapacity: 10, 
      minThreshold: 3, 
      status: 'Good', 
      icon: '🫧',
      presets: [{ label: '1 kg Pack', amount: 1 }, { label: '5 kg Tub', amount: 5 }] 
    },
    { 
      id: 'ing-milk',
      name: 'Fresh Whole Milk', 
      category: 'Dairy & Eggs',
      quantity: 18, 
      unit: 'L', 
      targetCapacity: 40, 
      minThreshold: 12, 
      status: 'Good', 
      icon: '🥛',
      presets: [{ label: '6 L (Pack)', amount: 6 }, { label: '12 L (Crate)', amount: 12 }] 
    },
    { 
      id: 'ing-cocoa',
      name: 'Dutch Cocoa Powder', 
      category: 'Sweeteners & Flavors',
      quantity: 6, 
      unit: 'kg', 
      targetCapacity: 15, 
      minThreshold: 5, 
      status: 'Good', 
      icon: '🍫',
      presets: [{ label: '2 kg Bag', amount: 2 }, { label: '5 kg Tub', amount: 5 }] 
    },
    { 
      id: 'ing-vanilla',
      name: 'Pure Vanilla Extract', 
      category: 'Sweeteners & Flavors',
      quantity: 1.2, 
      unit: 'L', 
      targetCapacity: 5, 
      minThreshold: 1, 
      status: 'Good', 
      icon: '✨',
      presets: [{ label: '250 ml', amount: 0.25 }, { label: '500 ml', amount: 0.5 }, { label: '1 L Jug', amount: 1 }] 
    }
  ];

  // Helper to ensure each ingredient object is fully populated
  const hydrateIngredients = (storedList) => {
    if (!Array.isArray(storedList) || storedList.length === 0) return DEFAULT_INGREDIENTS;
    return storedList.map((item, idx) => {
      const match = DEFAULT_INGREDIENTS.find(d => d.name.toLowerCase() === item.name.toLowerCase()) || {};
      const targetCapacity = item.targetCapacity || match.targetCapacity || 50;
      const minThreshold = item.minThreshold || match.minThreshold || 10;
      const quantity = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 0;
      return {
        id: item.id || match.id || `ing-${idx}`,
        name: item.name,
        category: item.category || match.category || 'Flour & Grains',
        quantity,
        unit: item.unit || match.unit || 'kg',
        targetCapacity,
        minThreshold,
        status: quantity <= minThreshold ? 'Low' : 'Good',
        icon: item.icon || match.icon || '🌾',
        presets: item.presets || match.presets || [
          { label: `5 ${item.unit || 'kg'}`, amount: 5 },
          { label: `15 ${item.unit || 'kg'}`, amount: 15 }
        ]
      };
    });
  };

  // Sample Bakery Ingredients Stock with localStorage persistence
  const [ingredients, setIngredients] = useState(() => {
    try {
      const stored = localStorage.getItem('bakeology_ingredients');
      return stored ? hydrateIngredients(JSON.parse(stored)) : DEFAULT_INGREDIENTS;
    } catch {
      return DEFAULT_INGREDIENTS;
    }
  });

  // Ingredients Hub state & filters
  const [ingSearchQuery, setIngSearchQuery] = useState('');
  const [ingFilterCategory, setIngFilterCategory] = useState('All');
  const [showLowIngredientsOnly, setShowLowIngredientsOnly] = useState(false);
  const [customIngQtys, setCustomIngQtys] = useState({});
  const [isAddIngModalOpen, setIsAddIngModalOpen] = useState(false);
  const [newIngForm, setNewIngForm] = useState({
    name: '',
    category: 'Flour & Grains',
    quantity: 10,
    unit: 'kg',
    minThreshold: 5,
    targetCapacity: 30,
    icon: '🌾'
  });

  const getCustomIngQty = (name) => customIngQtys[name] ?? 5;
  const setCustomIngQty = (name, val) => {
    setCustomIngQtys(prev => ({
      ...prev,
      [name]: Math.max(0.5, Math.min(500, Number(val) || 1))
    }));
  };

  const handleRestockIngredient = (name, amount) => {
    setIngredients(prev => {
      const updated = prev.map(ing => {
        if (ing.name === name) {
          const newQty = Math.round((ing.quantity + Number(amount)) * 10) / 10;
          return {
            ...ing,
            quantity: newQty,
            status: newQty >= ing.minThreshold ? 'Good' : 'Low'
          };
        }
        return ing;
      });
      localStorage.setItem('bakeology_ingredients', JSON.stringify(updated));
      return updated;
    });
    showToast(`Replenished +${amount} to ${name}!`, 'success');
  };

  const handleRestockAllLowIngredients = () => {
    const lowItems = ingredients.filter(i => i.status === 'Low' || i.quantity <= i.minThreshold);
    if (lowItems.length === 0) {
      showToast('All ingredients are already well stocked!', 'success');
      return;
    }
    setIngredients(prev => {
      const updated = prev.map(ing => {
        if (ing.status === 'Low' || ing.quantity <= ing.minThreshold) {
          return {
            ...ing,
            quantity: ing.targetCapacity,
            status: 'Good'
          };
        }
        return ing;
      });
      localStorage.setItem('bakeology_ingredients', JSON.stringify(updated));
      return updated;
    });
    showToast(`Pantry top-up complete! Restocked all ${lowItems.length} low supplies to target capacity! 🌾`, 'success');
  };

  const handleAddCustomIngredient = (e) => {
    e.preventDefault();
    if (!newIngForm.name.trim()) return;
    const qty = Number(newIngForm.quantity) || 0;
    const minT = Number(newIngForm.minThreshold) || 5;
    const targetC = Math.max(qty, Number(newIngForm.targetCapacity) || 30);
    const newEntry = {
      id: `ing-custom-${Date.now()}`,
      name: newIngForm.name.trim(),
      category: newIngForm.category,
      quantity: qty,
      unit: newIngForm.unit,
      minThreshold: minT,
      targetCapacity: targetC,
      status: qty <= minT ? 'Low' : 'Good',
      icon: newIngForm.icon || '🌾',
      presets: [
        { label: `5 ${newIngForm.unit}`, amount: 5 },
        { label: `15 ${newIngForm.unit}`, amount: 15 }
      ]
    };
    setIngredients(prev => {
      const updated = [...prev, newEntry];
      localStorage.setItem('bakeology_ingredients', JSON.stringify(updated));
      return updated;
    });
    setIsAddIngModalOpen(false);
    setNewIngForm({
      name: '',
      category: 'Flour & Grains',
      quantity: 10,
      unit: 'kg',
      minThreshold: 5,
      targetCapacity: 30,
      icon: '🌾'
    });
    showToast(`Added new pantry supply: ${newEntry.name}!`, 'success');
  };

  const lowIngredients = ingredients.filter(i => i.status === 'Low' || i.quantity <= i.minThreshold);
  const displayedIngredients = ingredients.filter(ing => {
    const matchesSearch = !ingSearchQuery.trim() || ing.name.toLowerCase().includes(ingSearchQuery.toLowerCase());
    const matchesCat = ingFilterCategory === 'All' || ing.category === ingFilterCategory;
    const matchesLow = !showLowIngredientsOnly || ing.status === 'Low' || ing.quantity <= ing.minThreshold;
    return matchesSearch && matchesCat && matchesLow;
  });

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
    { id: 'ingredients', label: 'Ingredients', icon: Wheat, badge: lowIngredients.length > 0 ? lowIngredients.length : undefined },
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
        activeTab === 'ingredients' ? 'Bakery Raw Ingredients & Pantry Hub' :
        activeTab === 'low-stock' ? 'Bakery Inventory & Counter Restock' :
        'Daily Baking Production Summary'
      }
      subtitle={
        activeTab === 'overview' ? 'Real-time baking orders, batch quantities, and oven status' :
        activeTab === 'queue' ? 'Start baking orders and mark hot batches as ready for counter' :
        activeTab === 'today-orders' ? 'Aggregated quantities of pastries required for current shift' :
        activeTab === 'ingredients' ? 'Track bulk pantry reserves, supplier delivery buffers, and replenishment' :
        activeTab === 'low-stock' ? 'Bake fresh batches, replenish display trays, and manage counter levels' :
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
        ) : activeTab === 'ingredients' && lowIngredients.length > 0 ? (
          <button
            type="button"
            className="btn-primary py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            onClick={handleRestockAllLowIngredients}
          >
            <Zap size={14} className="text-amber-300 fill-amber-300" />
            <span>Top Up Low ({lowIngredients.length})</span>
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

      {/* 4. INGREDIENTS TAB (BAKERY RAW INGREDIENTS & PANTRY HUB) */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          {/* Top Hero Replenishment Card */}
          <div className="baker-replenish-hero flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5 z-10">
              <span className="baker-hero-pill">
                <Wheat size={14} className="text-amber-300" />
                <span>Pantry Inventory & Bulk Supplies Hub</span>
              </span>
              <h2 className="text-xl font-black font-serif tracking-tight text-white">
                {lowIngredients.length > 0 
                  ? `${lowIngredients.length} Baking Supplies Below Safety Buffer` 
                  : 'All Baking Supplies Are Well Stocked!'}
              </h2>
              <p className="text-xs text-pink-100 max-w-xl leading-relaxed">
                Monitor and top up bakery flour, pure butter, farm eggs, yeast, and flavorings to prevent kitchen production halts during busy baking shifts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 z-10">
              {lowIngredients.length > 0 && (
                <button
                  type="button"
                  className="baker-hero-action-btn"
                  onClick={handleRestockAllLowIngredients}
                >
                  <Zap size={16} className="text-amber-500 fill-amber-500" />
                  <span>Top Up All Low Supplies</span>
                </button>
              )}
              <button
                type="button"
                className="baker-hero-action-btn"
                onClick={() => setIsAddIngModalOpen(true)}
              >
                <PlusCircle size={16} className="text-pink-600" />
                <span>Add Supply Item</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="baker-kpi-grid">
            <div className="baker-kpi-card kpi-amber">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-muted">Low Supplies</span>
                <div className="baker-kpi-icon-wrap bg-amber-100 text-amber-700">
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-amber-700 block">{lowIngredients.length}</span>
                <span className="text-2xs text-muted block mt-0.5">Below safe buffer</span>
              </div>
            </div>

            <div className="baker-kpi-card kpi-red">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-muted">Critical Level</span>
                <div className="baker-kpi-icon-wrap bg-red-100 text-red-700">
                  <AlertOctagon size={16} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-danger block">
                  {ingredients.filter(i => (i.quantity / i.targetCapacity) <= 0.25).length}
                </span>
                <span className="text-2xs text-muted block mt-0.5">&le; 25% capacity</span>
              </div>
            </div>

            <div className="baker-kpi-card kpi-green">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-muted">Optimal Supplies</span>
                <div className="baker-kpi-icon-wrap bg-green-100 text-green-700">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-success block">
                  {ingredients.filter(i => i.status === 'Good' && i.quantity > i.minThreshold).length}
                </span>
                <span className="text-2xs text-muted block mt-0.5">Ready for production</span>
              </div>
            </div>

            <div className="baker-kpi-card kpi-pink">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-muted">Pantry Varieties</span>
                <div className="baker-kpi-icon-wrap bg-pink-100 text-primary">
                  <Boxes size={16} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-primary block">{ingredients.length}</span>
                <span className="text-2xs text-muted block mt-0.5">Tracked ingredients</span>
              </div>
            </div>
          </div>

          {/* Search, Filter Mode & Category Controls */}
          <div className="baker-controls-bar">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
              {/* Search Bar */}
              <div className="baker-search-box">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search ingredient by name or type..."
                  value={ingSearchQuery}
                  onChange={(e) => setIngSearchQuery(e.target.value)}
                  className="baker-search-input"
                />
                {ingSearchQuery && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary cursor-pointer"
                    onClick={() => setIngSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* View Toggle */}
              <div className="baker-view-segmented shrink-0">
                <button
                  type="button"
                  className={`baker-view-tab ${showLowIngredientsOnly ? 'active-amber' : ''}`}
                  onClick={() => setShowLowIngredientsOnly(true)}
                >
                  <AlertTriangle size={13} />
                  <span>Low Buffer ({lowIngredients.length})</span>
                </button>
                <button
                  type="button"
                  className={`baker-view-tab ${!showLowIngredientsOnly ? 'active-pink' : ''}`}
                  onClick={() => setShowLowIngredientsOnly(false)}
                >
                  <Wheat size={13} />
                  <span>All Supplies ({ingredients.length})</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {['All', 'Flour & Grains', 'Dairy & Eggs', 'Sweeteners & Flavors', 'Leavening & Yeast'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`baker-category-chip ${ingFilterCategory === cat ? 'active' : ''}`}
                  onClick={() => setIngFilterCategory(cat)}
                >
                  {cat === 'All' ? '🌟 All Supplies' :
                   cat === 'Flour & Grains' ? '🌾 Flour & Grains' :
                   cat === 'Dairy & Eggs' ? '🧈 Dairy & Eggs' :
                   cat === 'Sweeteners & Flavors' ? '🍯 Sweeteners & Flavors' :
                   '🫧 Leavening & Yeast'}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients Grid */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs text-primary flex items-center gap-1.5">
                <Boxes size={15} className="text-primary" />
                <span>Pantry Supplies ({displayedIngredients.length})</span>
              </h3>
              <span className="text-2xs text-muted">Tap quick batch or enter delivery amount to restock</span>
            </div>

            {displayedIngredients.length === 0 ? (
              <div className="bg-card p-10 rounded-2xl border border-dashed border-border-medium text-center space-y-2">
                <CheckCircle size={32} className="mx-auto text-success" />
                <h4 className="font-bold text-sm text-primary">No supplies matching filter</h4>
                <p className="text-xs text-muted">All tracked pantry items are currently well-stocked above buffer levels.</p>
                <button
                  type="button"
                  className="btn-secondary py-1.5 px-3 text-xs font-bold rounded-xl mt-2 cursor-pointer"
                  onClick={() => {
                    setShowLowIngredientsOnly(false);
                    setIngFilterCategory('All');
                    setIngSearchQuery('');
                  }}
                >
                  Show All Ingredients
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {displayedIngredients.map(ing => {
                  const isLow = ing.status === 'Low' || ing.quantity <= ing.minThreshold;
                  const isCritical = (ing.quantity / ing.targetCapacity) <= 0.25;
                  const currentCustomQty = getCustomIngQty(ing.name);
                  const progressPct = Math.min(100, Math.round((ing.quantity / ing.targetCapacity) * 100));

                  return (
                    <div 
                      key={ing.id || ing.name}
                      className={`ingredient-card ${isCritical ? 'ing-critical' : isLow ? 'ing-low' : ''}`}
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="ing-icon-box">
                              {ing.icon || '🌾'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-primary truncate leading-tight">{ing.name}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-pink-50 text-primary border border-border-light">
                                  {ing.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span className={`baker-card-badge shrink-0 ${
                            isCritical ? 'baker-badge-critical' :
                            isLow ? 'baker-badge-low' :
                            'baker-badge-good'
                          }`}>
                            {isCritical ? `Critical (${ing.quantity} ${ing.unit})` :
                             isLow ? `Low Buffer (${ing.quantity} ${ing.unit})` :
                             `In Stock`}
                          </span>
                        </div>

                        {/* Storage Gauge */}
                        <div className="space-y-1 pt-1 border-t border-border-light">
                          <div className="flex justify-between text-2xs font-bold text-muted">
                            <span>Storage Level:</span>
                            <span className="text-primary font-black">{ing.quantity} / {ing.targetCapacity} {ing.unit} ({progressPct}%)</span>
                          </div>
                          <div className="baker-gauge-track">
                            <div 
                              className={`baker-gauge-fill ${
                                isCritical ? 'fill-critical' : isLow ? 'fill-low' : 'fill-good'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-3xs text-muted pt-0.5 font-medium">
                            <span>Min Buffer: {ing.minThreshold} {ing.unit}</span>
                            <span>Target: {ing.targetCapacity} {ing.unit}</span>
                          </div>
                        </div>
                      </div>

                      {/* Restock Actions */}
                      <div className="space-y-2 pt-2 border-t border-border-light">
                        {/* Quick Presets */}
                        <div>
                          <span className="text-3xs font-extrabold uppercase tracking-wider text-muted block mb-1">Quick Restock:</span>
                          <div className="flex gap-1.5">
                            {ing.presets?.map((preset, pidx) => (
                              <button
                                key={pidx}
                                type="button"
                                className="ing-quick-btn"
                                onClick={() => handleRestockIngredient(ing.name, preset.amount)}
                              >
                                <Plus size={11} />
                                <span>{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Stepper */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <div className="baker-stepper-box shrink-0">
                            <button
                              type="button"
                              className="baker-stepper-btn"
                              onClick={() => setCustomIngQty(ing.name, currentCustomQty - (ing.unit === 'L' && ing.name.includes('Vanilla') ? 0.25 : 1))}
                              disabled={currentCustomQty <= 0.5}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="baker-stepper-value">
                              {currentCustomQty} {ing.unit}
                            </span>
                            <button
                              type="button"
                              className="baker-stepper-btn"
                              onClick={() => setCustomIngQty(ing.name, currentCustomQty + (ing.unit === 'L' && ing.name.includes('Vanilla') ? 0.25 : 1))}
                              aria-label="Increase quantity"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="baker-add-stock-btn"
                            onClick={() => handleRestockIngredient(ing.name, currentCustomQty)}
                          >
                            <Plus size={12} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Custom Ingredient Modal */}
          {isAddIngModalOpen && (
            <div className="baker-modal-overlay" onClick={() => setIsAddIngModalOpen(false)}>
              <div className="baker-modal-card space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-border-light pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-primary">
                      <PlusCircle size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-primary">Add New Bakery Supply</h3>
                      <p className="text-2xs text-muted">Track a new raw pantry ingredient or packaging material</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-1 rounded-lg text-muted hover:text-primary hover:bg-pink-50 cursor-pointer"
                    onClick={() => setIsAddIngModalOpen(false)}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAddCustomIngredient} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-2xs font-extrabold text-muted uppercase mb-1">Ingredient / Supply Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dark Chocolate Callets, Cinnamon, Matcha..."
                      value={newIngForm.name}
                      onChange={(e) => setNewIngForm({ ...newIngForm, name: e.target.value })}
                      className="baker-search-input pl-3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-2xs font-extrabold text-muted uppercase mb-1">Category</label>
                      <select
                        value={newIngForm.category}
                        onChange={(e) => setNewIngForm({ ...newIngForm, category: e.target.value })}
                        className="baker-search-input pl-3"
                      >
                        <option value="Flour & Grains">Flour & Grains</option>
                        <option value="Dairy & Eggs">Dairy & Eggs</option>
                        <option value="Sweeteners & Flavors">Sweeteners & Flavors</option>
                        <option value="Leavening & Yeast">Leavening & Yeast</option>
                        <option value="Packaging & Others">Packaging & Others</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-2xs font-extrabold text-muted uppercase mb-1">Unit of Measure</label>
                      <select
                        value={newIngForm.unit}
                        onChange={(e) => setNewIngForm({ ...newIngForm, unit: e.target.value })}
                        className="baker-search-input pl-3"
                      >
                        <option value="kg">kg (Kilograms)</option>
                        <option value="g">g (Grams)</option>
                        <option value="L">L (Liters)</option>
                        <option value="ml">ml (Milliliters)</option>
                        <option value="pcs">pcs (Pieces)</option>
                        <option value="packs">packs (Packs)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-2xs font-extrabold text-muted uppercase mb-1">Current Stock</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        required
                        value={newIngForm.quantity}
                        onChange={(e) => setNewIngForm({ ...newIngForm, quantity: e.target.value })}
                        className="baker-search-input pl-3"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-extrabold text-muted uppercase mb-1">Min Buffer</label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        required
                        value={newIngForm.minThreshold}
                        onChange={(e) => setNewIngForm({ ...newIngForm, minThreshold: e.target.value })}
                        className="baker-search-input pl-3"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-extrabold text-muted uppercase mb-1">Target Max</label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        required
                        value={newIngForm.targetCapacity}
                        onChange={(e) => setNewIngForm({ ...newIngForm, targetCapacity: e.target.value })}
                        className="baker-search-input pl-3"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-extrabold text-muted uppercase mb-1">Pantry Emoji Icon</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength="2"
                        value={newIngForm.icon}
                        onChange={(e) => setNewIngForm({ ...newIngForm, icon: e.target.value })}
                        className="w-12 text-center text-lg baker-search-input pl-0"
                      />
                      <div className="flex gap-1.5 overflow-x-auto">
                        {['🌾', '🧈', '🥚', '🥛', '🍫', '✨', '🍯', '🫧', '🧂', '🧁'].map(ico => (
                          <button
                            key={ico}
                            type="button"
                            className="px-2 py-1 bg-cream-pure hover:bg-pink-100 rounded-lg text-sm border border-border-light cursor-pointer"
                            onClick={() => setNewIngForm({ ...newIngForm, icon: ico })}
                          >
                            {ico}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border-light">
                    <button
                      type="button"
                      className="btn-secondary py-2 px-4 rounded-xl text-xs font-bold cursor-pointer"
                      onClick={() => setIsAddIngModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary py-2 px-5 rounded-xl text-xs font-extrabold shadow-sm cursor-pointer"
                    >
                      Save Supply Item
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. LOW STOCK & INVENTORY REPLENISHMENT TAB */}
      {activeTab === 'low-stock' && (
        <div className="space-y-4">
          {/* Top Hero Replenishment Card */}
          <div className="baker-replenish-hero flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5 z-10">
              <span className="baker-hero-pill">
                <Flame size={14} className="text-amber-300" />
                <span>Oven Production & Counter Display Restock</span>
              </span>
              <h2 className="text-xl font-black font-serif tracking-tight text-white">
                {lowStockProducts.length > 0 
                  ? `${lowStockProducts.length} Pastries Require Oven Restock` 
                  : 'All Pastry Trays Are Fully Stocked!'}
              </h2>
              <p className="text-xs text-pink-100 max-w-xl leading-relaxed">
                Bake fresh batches, replenish display trays, and manage stock levels directly to the front counter so customers always find fresh loaves, cakes, and pastries.
              </p>
            </div>

            <div className="flex items-center gap-2.5 z-10">
              {lowStockProducts.length > 0 ? (
                <button
                  type="button"
                  className="baker-hero-action-btn"
                  onClick={handleRestockAllLowStock}
                >
                  <Zap size={16} className="text-amber-500 fill-amber-500" />
                  <span>Bake & Restock All (+12 Each)</span>
                </button>
              ) : (
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-white border border-white/30">
                  <CheckCircle size={16} className="text-green-300" />
                  <span>Display Trays Fully Stocked</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="baker-kpi-grid">
            <div className="baker-kpi-card kpi-amber">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-muted">Low Stock Alerts</span>
                <div className="baker-kpi-icon-wrap bg-amber-100 text-amber-700">
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-amber-700 block">{lowStockProducts.length}</span>
                <span className="text-2xs text-muted block mt-0.5">&le; 10 units left</span>
              </div>
            </div>

            <div className="baker-kpi-card kpi-red">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-muted">Out of Stock</span>
                <div className="baker-kpi-icon-wrap bg-red-100 text-red-700">
                  <AlertOctagon size={16} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-danger block">
                  {products.filter(p => p.stock === 0).length}
                </span>
                <span className="text-2xs text-muted block mt-0.5">Sold out / critical</span>
              </div>
            </div>

            <div className="baker-kpi-card kpi-green">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-muted">Healthy Trays</span>
                <div className="baker-kpi-icon-wrap bg-green-100 text-green-700">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-success block">
                  {products.filter(p => p.stock > 10).length}
                </span>
                <span className="text-2xs text-muted block mt-0.5">&gt; 10 units available</span>
              </div>
            </div>

            <div className="baker-kpi-card kpi-pink">
              <div className="flex justify-between items-start">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-muted">Total Finished Stock</span>
                <div className="baker-kpi-icon-wrap bg-pink-100 text-primary">
                  <Layers size={16} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-primary block">
                  {products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0)}
                </span>
                <span className="text-2xs text-muted block mt-0.5">Units in display</span>
              </div>
            </div>
          </div>

          {/* Search, Filter Mode & Category Controls */}
          <div className="baker-controls-bar">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
              {/* Search Bar */}
              <div className="baker-search-box">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search pastry by name to add stock..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className="baker-search-input"
                />
                {stockSearchQuery && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary cursor-pointer"
                    onClick={() => setStockSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* View Toggle */}
              <div className="baker-view-segmented shrink-0">
                <button
                  type="button"
                  className={`baker-view-tab ${showLowStockOnly ? 'active-amber' : ''}`}
                  onClick={() => setShowLowStockOnly(true)}
                >
                  <AlertTriangle size={13} />
                  <span>Low Stock Only ({lowStockProducts.length})</span>
                </button>
                <button
                  type="button"
                  className={`baker-view-tab ${!showLowStockOnly ? 'active-pink' : ''}`}
                  onClick={() => setShowLowStockOnly(false)}
                >
                  <Package size={13} />
                  <span>All Pastries ({products.length})</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {['All', 'Bread', 'Cake', 'Pastry', 'Beverage', 'Dessert'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`baker-category-chip ${stockFilterCategory === cat ? 'active' : ''}`}
                  onClick={() => setStockFilterCategory(cat)}
                >
                  {cat === 'All' ? '🌟 All Items' :
                   cat === 'Bread' ? '🍞 Bread' :
                   cat === 'Cake' ? '🍰 Cake' :
                   cat === 'Pastry' ? '🥐 Pastry' :
                   cat === 'Beverage' ? '☕ Beverage' :
                   '🧁 Dessert'}
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
              <span className="text-2xs text-muted">Tap quick batch or enter custom amount to add stock</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {displayedStockProducts.map(p => {
                  const isOutOfStock = p.stock === 0;
                  const isCritical = p.stock > 0 && p.stock <= 5;
                  const isLow = p.stock > 5 && p.stock <= 10;
                  const currentCustomQty = getCustomQty(p.id);
                  const progressPct = Math.min(100, Math.round((p.stock / 50) * 100));

                  return (
                    <div 
                      key={p.id} 
                      className={`baker-card ${
                        isOutOfStock || isCritical ? 'card-critical' :
                        isLow ? 'card-low' : ''
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Top Card Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-pink-50 border border-border-light flex items-center justify-center shrink-0">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-8 h-8 object-contain" />
                              ) : (
                                <span className="text-2xl">{p.icon || '🥐'}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-primary truncate leading-tight">{p.name}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-primary">
                                  {p.category}
                                </span>
                                <span className="text-2xs text-muted font-black">
                                  {formatCurrency(p.price)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span className={`baker-card-badge shrink-0 ${
                            isOutOfStock ? 'baker-badge-critical' :
                            isCritical ? 'baker-badge-critical' :
                            isLow ? 'baker-badge-low' :
                            'baker-badge-good'
                          }`}>
                            {isOutOfStock ? 'Sold Out' : isCritical ? `Critical (${p.stock})` : isLow ? `${p.stock} left` : `${p.stock} units`}
                          </span>
                        </div>

                        {/* Stock Capacity Progress Bar */}
                        <div className="space-y-1 pt-1 border-t border-border-light">
                          <div className="flex justify-between text-2xs font-bold text-muted">
                            <span>Counter Display Level</span>
                            <span className="text-primary font-black">{p.stock} / 50 units ({progressPct}%)</span>
                          </div>
                          <div className="baker-gauge-track">
                            <div 
                              className={`baker-gauge-fill ${
                                isOutOfStock || isCritical ? 'fill-critical' :
                                isLow ? 'fill-low' :
                                'fill-good'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Replenish Actions */}
                      <div className="space-y-2 pt-2 border-t border-border-light">
                        {/* Quick Preset Buttons */}
                        <div>
                          <span className="text-3xs font-extrabold uppercase tracking-wider text-muted block mb-1">Quick Batch Bake:</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              className="baker-batch-btn"
                              onClick={() => handleAddStock(p.id, 6)}
                              title="Bake half dozen"
                            >
                              <Plus size={11} />
                              <span>6 pcs</span>
                            </button>

                            <button
                              type="button"
                              className="baker-batch-btn"
                              onClick={() => handleAddStock(p.id, 12)}
                              title="Bake 1 dozen batch"
                            >
                              <Plus size={11} />
                              <span>12 pcs</span>
                            </button>

                            <button
                              type="button"
                              className="baker-batch-btn"
                              onClick={() => handleAddStock(p.id, 24)}
                              title="Bake full tray"
                            >
                              <Plus size={11} />
                              <span>24 pcs</span>
                            </button>
                          </div>
                        </div>

                        {/* Custom Counter & Add Stock Button */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <div className="baker-stepper-box shrink-0">
                            <button
                              type="button"
                              className="baker-stepper-btn"
                              onClick={() => setCustomQty(p.id, currentCustomQty - 1)}
                              disabled={currentCustomQty <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="baker-stepper-value">
                              {currentCustomQty}
                            </span>
                            <button
                              type="button"
                              className="baker-stepper-btn"
                              onClick={() => setCustomQty(p.id, currentCustomQty + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="baker-add-stock-btn"
                            onClick={() => handleAddStock(p.id, currentCustomQty)}
                          >
                            <ChefHat size={13} />
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

          {/* Bakery Pantry Cross-Link Reminder Box */}
          <div className="bg-card p-4 rounded-2xl border border-border-light shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                lowIngredients.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
              }`}>
                <Wheat size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-primary">
                  {lowIngredients.length > 0 
                    ? `Bakery Pantry Check: ${lowIngredients.length} supplies below safe buffers` 
                    : 'Bakery Pantry Buffer: All raw dough & pantry supplies fully stocked'}
                </h4>
                <p className="text-2xs text-muted">
                  {lowIngredients.length > 0 
                    ? `Low items: ${lowIngredients.map(i => i.name).slice(0, 3).join(', ')}${lowIngredients.length > 3 ? '...' : ''}` 
                    : 'Flours, butter, dairy, and yeast are ready for ongoing kitchen shifts.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              onClick={() => setActiveTab('ingredients')}
            >
              <span>Manage Ingredients Hub</span>
              <ArrowRight size={13} />
            </button>
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
