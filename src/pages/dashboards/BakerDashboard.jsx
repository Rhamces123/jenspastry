// ==========================================
// Jen's Pastry Shop - Baker Dashboard (Kitchen & Production)
// Section 9: Dashboard, Production Queue, Today's Orders, Ingredients, Low Stock, Production Summary, Logout
// ==========================================

import React, { useState } from 'react';
import { useShop } from '../../hooks/useShop.js';
import { ROLES } from '../../constants/roles.js';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import { formatDate } from '../../utils/formatters.js';
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
  ListOrdered
} from 'lucide-react';

export default function BakerDashboard() {
  const { products, sales } = useShop();
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

  // Metrics
  const pendingOrders = productionOrders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed');
  const preparingOrders = productionOrders.filter(o => o.orderStatus === 'Preparing');
  const readyOrders = productionOrders.filter(o => o.orderStatus === 'Ready for Pickup');
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

  // Sample Bakery Ingredients Stock
  const [ingredients] = useState([
    { name: 'All-Purpose Flour', quantity: 45, unit: 'kg', status: 'Good' },
    { name: 'Granulated Sugar', quantity: 22, unit: 'kg', status: 'Good' },
    { name: 'Pure Unsalted Butter', quantity: 8, unit: 'kg', status: 'Low' },
    { name: 'Fresh Farm Eggs', quantity: 36, unit: 'pcs', status: 'Low' },
    { name: 'Active Dry Yeast', quantity: 4.5, unit: 'kg', status: 'Good' },
    { name: 'Fresh Whole Milk', quantity: 18, unit: 'L', status: 'Good' },
    { name: 'Dutch Cocoa Powder', quantity: 6, unit: 'kg', status: 'Good' },
    { name: 'Pure Vanilla Extract', quantity: 1.2, unit: 'L', status: 'Good' }
  ]);

  const lowStockProducts = products.filter(p => p.stock <= 10);

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
        activeTab === 'ingredients' ? 'Bakery Raw Ingredients' :
        activeTab === 'low-stock' ? 'Low Stock Warnings' :
        'Daily Baking Production Summary'
      }
      subtitle={
        activeTab === 'overview' ? 'Real-time baking orders, batch quantities, and oven status' :
        activeTab === 'queue' ? 'Start baking orders and mark hot batches as ready for counter' :
        activeTab === 'today-orders' ? 'Aggregated quantities of pastries required for current shift' :
        activeTab === 'ingredients' ? 'Monitor dough, butter, and pantry supplies' :
        activeTab === 'low-stock' ? 'Pastries and ingredients requiring restock attention' :
        'Completed loaves, cakes, and pastry tallies'
      }
      navigationItems={navItems}
      activeItem={activeTab}
      onSelectItem={setActiveTab}
      headerActions={
        activeTab !== 'queue' && (pendingOrders.length + preparingOrders.length) > 0 ? (
          <button
            type="button"
            className="btn-primary py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
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
                      {order.orderStatus}
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
                const isReady = order.orderStatus === 'Ready for Pickup';

                return (
                  <div key={order.id} className="bg-card p-4 rounded-xl border border-border-light shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start border-b border-border-light pb-2">
                      <div>
                        <span className="font-bold text-sm text-primary block">ORDER #{order.saleNumber}</span>
                        <span className="text-2xs text-muted">Placed: {formatDate(order.date)}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-2xs font-extrabold border ${
                        isReady ? 'bg-green-100 text-green-700 border-green-200' :
                        isPreparing ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {order.orderStatus}
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
                        className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
                        onClick={() => handleAdvanceStatus(order.id, 'Preparing')}
                      >
                        <Play size={14} />
                        <span>Start Preparing</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        type="button"
                        className="bg-green-600 hover:bg-green-700 text-white w-full py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all"
                        onClick={() => handleAdvanceStatus(order.id, 'Ready for Pickup')}
                      >
                        <CheckCircle2 size={14} />
                        <span>Mark as Ready (Fresh from Oven)</span>
                      </button>
                    )}

                    {isReady && (
                      <div className="p-2 bg-green-50 rounded-xl text-center text-xs font-bold text-green-700 border border-green-200 flex items-center justify-center gap-1.5">
                        <CheckCircle size={15} />
                        <span>Ready at Counter for Customer</span>
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
          <h3 className="font-bold text-xs text-primary">Bakery Raw Ingredients Inventory</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {ingredients.map(ing => (
              <div key={ing.name} className="bg-card p-3 rounded-xl border border-border-light space-y-2 shadow-2xs">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-primary">{ing.name}</span>
                  <span className={`text-2xs px-2 py-0.5 rounded-full font-bold ${
                    ing.status === 'Low' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {ing.status}
                  </span>
                </div>
                <div className="pt-2 border-t border-border-light flex justify-between text-xs">
                  <span className="text-muted">In Stock:</span>
                  <span className="font-bold text-text-primary">{ing.quantity} {ing.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LOW STOCK TAB */}
      {activeTab === 'low-stock' && (
        <div className="space-y-3 max-w-xl mx-auto">
          <div className="bg-card p-4 rounded-xl border border-border-light space-y-3 shadow-2xs">
            <h3 className="font-bold text-xs text-primary flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>Low Stock Bakery Alerts (&lt; 10 units)</span>
            </h3>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">All pastries are well stocked!</p>
            ) : (
              <div className="divide-y divide-border-light">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-primary block">{p.name}</span>
                      <span className="text-2xs text-muted">{p.category}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-2xs font-extrabold bg-red-100 text-red-700 border border-red-200">
                      {p.stock} units left
                    </span>
                  </div>
                ))}
              </div>
            )}
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
    </DashboardLayout>
  );
}
