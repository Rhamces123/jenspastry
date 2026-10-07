// ==========================================
// Jen's Pastry Shop - Baker Dashboard (Kitchen & Production)
// Connected Bakery Inventory & Recipe-Driven Production Workflow
// Section 5: Dashboard, Production Queue, Ingredient Inventory, Recipes, Production History, Low Ingredient Alerts, Logout
// ==========================================

import React, { useState, useEffect, useMemo } from 'react';
import { useShop } from '../../hooks/useShop.js';
import { useAuth } from '../../context/useAuth.js';
import { ROLES } from '../../constants/roles.js';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import NotificationToast from '../../components/NotificationToast.jsx';
import ManualProductionModal from '../../components/baker/ManualProductionModal.jsx';
import { useBakeryWorkflow } from '../../hooks/useBakeryWorkflow.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
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
  BookOpen, 
  Plus, 
  Package, 
  Search, 
  TrendingDown
} from 'lucide-react';

export default function BakerDashboard() {
  const { products } = useShop();
  const { currentUser, userProfile } = useAuth();
  const bakerName = userProfile?.fullName || currentUser?.displayName || 'Baker Staff';

  const { 
    ingredients, 
    recipes, 
    productionRequests, 
    productionBatches,
    getRecipeForProduct,
    calculateRequiredIngredients,
    checkIngredientsSufficiency,
    createProductionRequest,
    updateProductionRequestStatus,
    startProduction,
    completeProduction,
    addNotification,
    checkAndTriggerLowStock
  } = useBakeryWorkflow();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Manual production modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Trigger low-stock check whenever products update
  useEffect(() => {
    if (products && products.length > 0) {
      checkAndTriggerLowStock(products);
    }
  }, [products, checkAndTriggerLowStock]);

  // Filter out beverages (kitchen cooks pastries, bread, cakes, desserts)
  const cashierPastries = useMemo(() => {
    return (products || []).filter(p => p.category !== 'Beverage');
  }, [products]);

  // Cashier low stock pastries (stock <= minimumStock)
  const cashierLowStockPastries = useMemo(() => {
    return cashierPastries.filter(p => {
      const stock = Number(p.stock) || 0;
      const minStock = p.minimumStock !== undefined ? Number(p.minimumStock) : 20;
      return stock <= minStock;
    });
  }, [cashierPastries]);

  // Filter for cashier stock monitor tab/section
  const [cashierCategoryFilter, setCashierCategoryFilter] = useState('ALL');
  const [cashierSearchQuery, setCashierSearchQuery] = useState('');

  const filteredCashierPastries = useMemo(() => {
    return cashierPastries.filter(p => {
      const matchesSearch = !cashierSearchQuery.trim() ||
        p.name.toLowerCase().includes(cashierSearchQuery.toLowerCase());
      const minStock = p.minimumStock !== undefined ? Number(p.minimumStock) : 20;
      const matchesCat = cashierCategoryFilter === 'ALL'
        ? true
        : cashierCategoryFilter === 'LOW_STOCK'
        ? (Number(p.stock) || 0) <= minStock
        : p.category === cashierCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [cashierPastries, cashierSearchQuery, cashierCategoryFilter]);

  // Status progression filter for queue
  const [queueStatusFilter, setQueueStatusFilter] = useState('ALL');
  const [queueSearchQuery, setQueueSearchQuery] = useState('');

  // Selected recipe in Recipes Tab for live scaler
  const [selectedRecipeId, setSelectedRecipeId] = useState(recipes[0]?.id || '');
  const [scaleTargetQty, setScaleTargetQty] = useState(30);

  // Filtered production requests
  const filteredRequests = useMemo(() => {
    return productionRequests.filter(req => {
      const matchesStatus = queueStatusFilter === 'ALL' || req.status === queueStatusFilter;
      const matchesSearch = !queueSearchQuery.trim() || 
        req.productName.toLowerCase().includes(queueSearchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(queueSearchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [productionRequests, queueStatusFilter, queueSearchQuery]);

  // Metrics
  const pendingRequests = useMemo(() => productionRequests.filter(r => r.status === 'Pending'), [productionRequests]);
  const acceptedRequests = useMemo(() => productionRequests.filter(r => r.status === 'Accepted'), [productionRequests]);
  const preparingRequests = useMemo(() => productionRequests.filter(r => r.status === 'Preparing'), [productionRequests]);
  const readyRequests = useMemo(() => productionRequests.filter(r => r.status === 'Ready for Cashier'), [productionRequests]);
  const activeQueueCount = pendingRequests.length + acceptedRequests.length + preparingRequests.length;

  // Low ingredients check
  const lowIngredients = useMemo(() => {
    return ingredients.filter(i => (Number(i.quantity) || 0) <= (Number(i.minimumStock) || 0));
  }, [ingredients]);
  const lowIngredientsCount = lowIngredients.length;

  // Total pcs baked today
  const totalBakedToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return productionBatches
      .filter(b => b.completedAt && b.completedAt.startsWith(todayStr))
      .reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  }, [productionBatches]);

  // Selected recipe object
  const currentRecipe = useMemo(() => {
    return recipes.find(r => r.id === selectedRecipeId) || recipes[0] || null;
  }, [recipes, selectedRecipeId]);

  // Scaler calculation for current recipe
  const scaledIngredients = useMemo(() => {
    if (!currentRecipe) return [];
    return calculateRequiredIngredients(currentRecipe, scaleTargetQty);
  }, [currentRecipe, scaleTargetQty, calculateRequiredIngredients]);

  // Ingredient search in Pantry tab
  const [ingSearchQuery, setIngSearchQuery] = useState('');
  const [ingFilterCategory, setIngFilterCategory] = useState('ALL');
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      const matchesSearch = !ingSearchQuery.trim() || ing.name.toLowerCase().includes(ingSearchQuery.toLowerCase());
      const matchesCat = ingFilterCategory === 'ALL' || ing.category === ingFilterCategory;
      return matchesSearch && matchesCat;
    });
  }, [ingredients, ingSearchQuery, ingFilterCategory]);

  const ingredientCategories = useMemo(() => {
    const set = new Set(ingredients.map(i => i.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [ingredients]);

  // Helper to find existing active request for a product
  const getActiveRequestForProduct = (product) => {
    const prodId = String(product.id || '').toLowerCase();
    const prodName = String(product.name || '').toLowerCase();
    return productionRequests.find(r => 
      (String(r.productId || '').toLowerCase() === prodId || String(r.productName || '').toLowerCase() === prodName) &&
      ['Pending', 'Accepted', 'Preparing', 'Ready for Cashier'].includes(r.status)
    );
  };

  // Handlers for Request Actions
  const handleAcceptRequest = (requestId) => {
    try {
      updateProductionRequestStatus(requestId, 'Accepted');
      showToast('Production request accepted by Baker.', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleStartProduction = (requestId) => {
    try {
      startProduction(requestId, bakerName);
      showToast('🔥 Oven started! Status updated to "Preparing".', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCompleteProduction = (request) => {
    try {
      const batch = completeProduction({
        requestId: request.id,
        productName: request.productName,
        productId: request.productId,
        quantity: request.requestedQuantity,
        bakerName
      });
      showToast(`✓ Cooking completed for ${batch.quantity} pcs ${batch.productName}! Ingredients deducted automatically. Status: Ready for Cashier.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Start Cooking a pastry directly from the Low Stock counter view
  const handleCookPastry = (product) => {
    try {
      const batchSize = Number(product.productionBatchSize) || 30;
      const recipe = getRecipeForProduct({ id: product.id, name: product.name });
      
      // Ingredient check
      const check = checkIngredientsSufficiency(recipe, batchSize);
      if (!check.sufficient) {
        const missingMsg = check.shortages.map(s => `${s.ingredientName} (needs ${s.required} ${s.unit}, have ${s.available} ${s.unit})`).join(', ');
        showToast(`Cannot start cooking ${product.name}: Insufficient ingredients in pantry. Missing: ${missingMsg}`, 'error');
        return;
      }

      let req = getActiveRequestForProduct(product);
      if (!req) {
        req = createProductionRequest({
          productId: product.id,
          productName: product.name,
          requestedQuantity: batchSize,
          priority: product.stock === 0 ? 'Urgent' : 'High',
          currentStock: product.stock,
          minimumStock: product.minimumStock !== undefined ? product.minimumStock : 20,
          triggeredBy: 'Baker Cooking Station'
        });
      }

      // Transition to Preparing ("Cooking in Oven")
      startProduction(req.id, bakerName);
      showToast(`🔥 Oven started for ${batchSize} pcs of ${product.name}! Cooking in progress.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSendAdminAlert = (ingredientName) => {
    addNotification({
      type: 'baker_restock_alert',
      title: 'Pantry Restock Requested',
      message: `Baker requested restock for ${ingredientName}. Stock is currently low or depleted.`,
      targetRole: 'admin',
      referenceId: 'PANTRY'
    });
    showToast(`Restock request for "${ingredientName}" sent to Store Owner / Admin!`, 'success');
  };

  // Navigation Items matching Cooking Station workflow
  const navItems = [
    { id: 'overview', label: 'Cooking Dashboard', icon: Flame, badge: preparingRequests.length > 0 ? `${preparingRequests.length} in oven` : null },
    { id: 'cashierStock', label: 'Cashier Pastry Stock', icon: Package, badge: cashierLowStockPastries.length > 0 ? `${cashierLowStockPastries.length} low` : null },
    { id: 'queue', label: 'Production Queue', icon: Clock, badge: activeQueueCount > 0 ? activeQueueCount : null },
    { id: 'ingredients', label: 'Ingredient Inventory', icon: Wheat, badge: lowIngredientsCount > 0 ? lowIngredientsCount : null },
    { id: 'recipes', label: 'Recipes', icon: BookOpen },
    { id: 'history', label: 'Production History', icon: Layers },
    { id: 'alerts', label: 'Low Ingredient Alerts', icon: AlertTriangle, badge: lowIngredientsCount > 0 ? lowIngredientsCount : null }
  ];

  return (
    <DashboardLayout
      role={ROLES.BAKER}
      title={
        activeTab === 'overview' ? 'Baker Cooking & Oven Station' :
        activeTab === 'cashierStock' ? 'Cashier Finished Pastry Stock' :
        activeTab === 'queue' ? 'Bakery Production Queue' :
        activeTab === 'ingredients' ? 'Raw Ingredient Inventory (Pantry)' :
        activeTab === 'recipes' ? 'Bakery Recipes & Formula Scaler' :
        activeTab === 'history' ? 'Bakery Production History & Batches' :
        'Low Ingredient Alerts & Depletion Notice'
      }
      subtitle={
        activeTab === 'overview' ? 'Real-time oven cooking, batch baking, and low-stock cashier pastry replenishment' :
        activeTab === 'cashierStock' ? 'Live finished pastry stock levels at the cashier counter needing baking' :
        activeTab === 'queue' ? 'Fulfill cashier low-stock requests with automated ingredient checking' :
        activeTab === 'ingredients' ? 'Available raw ingredients and supplies for baking (View Only)' :
        activeTab === 'recipes' ? 'Formulations, base yields, and dynamic batch scaling calculations' :
        activeTab === 'history' ? 'Audited records of completed pastry batches and ingredient consumption' :
        'Pantry shortages requiring Store Owner / Admin purchase orders'
      }
      navigationItems={navItems}
      activeItem={activeTab}
      onSelectItem={setActiveTab}
      headerActions={
        <button
          type="button"
          className="btn-primary py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
          onClick={() => setIsManualModalOpen(true)}
        >
          <ChefHat size={15} />
          <span>+ Manual Bake Batch</span>
        </button>
      }
    >
      {/* ================================================= */}
      {/* 1. DASHBOARD OVERVIEW — COOKING & CASHIER LOW STOCK */}
      {/* ================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-card p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-2xs">
              <span className="text-2xs font-bold text-amber-800 block uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                In Oven (Cooking)
              </span>
              <span className="text-2xl font-black text-amber-600 block mt-1">{preparingRequests.length}</span>
              <span className="text-xs text-amber-700 block mt-0.5">Currently baking</span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-2xs">
              <span className="text-2xs font-bold text-rose-800 block uppercase tracking-wider flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                Cashier Low Stock
              </span>
              <span className="text-2xl font-black text-rose-600 block mt-1">{cashierLowStockPastries.length}</span>
              <span className="text-xs text-rose-700 block mt-0.5">Pastries need baking</span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs font-bold text-muted block uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Awaiting Oven
              </span>
              <span className="text-2xl font-black text-blue-600 block mt-1">{pendingRequests.length + acceptedRequests.length}</span>
              <span className="text-xs text-muted block mt-0.5">Queued batches</span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs">
              <span className="text-2xs font-bold text-emerald-800 block uppercase tracking-wider flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Ready for Cashier
              </span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">{readyRequests.length}</span>
              <span className="text-xs text-emerald-700 block mt-0.5">Fresh on counter pass</span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border-light shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-2xs font-bold text-muted block uppercase tracking-wider">Today's Output</span>
              <span className="text-2xl font-black text-gray-800 block mt-1">{totalBakedToday} pcs</span>
              <span className="text-xs text-muted block mt-0.5">Fresh baked today</span>
            </div>
          </div>

          {/* Low Ingredient Warning Banner if any */}
          {lowIngredientsCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {lowIngredientsCount} Raw {lowIngredientsCount === 1 ? 'Ingredient is' : 'Ingredients are'} Running Low in Pantry
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {lowIngredients.map(i => `${i.name} (${i.quantity} ${i.unit} left)`).join(' • ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('alerts')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                View Alerts & Notify Admin →
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. ACTIVE COOKING WORKSTATION (IN OVEN)                   */}
          {/* ========================================================= */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-600 animate-pulse" />
                  Active Cooking Station (In Oven)
                </h3>
                <p className="text-xs text-gray-500">Batches currently baking — click "Finish Cooking" when ready to deduct ingredients and send to cashier</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {preparingRequests.length} Active in Oven
              </span>
            </div>

            {preparingRequests.length === 0 ? (
              <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/60 rounded-xl p-6 border border-amber-200/70 text-center space-y-3">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Oven Station is Ready for Next Batch</h4>
                  <p className="text-xs text-gray-600 max-w-md mx-auto mt-1">
                    No batches are currently baking in the oven. Check the Cashier Low-Stock Pastries section below to cook a fresh replenishment batch!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  className="px-4 py-2 bg-[#D81B60] hover:bg-[#C2185B] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  + Start Custom Bake Batch
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {preparingRequests.map(req => {
                  const recipe = getRecipeForProduct({ id: req.productId, name: req.productName });
                  const check = checkIngredientsSufficiency(recipe, req.requestedQuantity);

                  return (
                    <div 
                      key={req.id} 
                      className="bg-amber-50/80 border-2 border-amber-400 rounded-xl p-4 space-y-3 shadow-xs relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 inline-flex items-center gap-1 mb-1">
                            <Flame className="w-3 h-3 text-amber-700 animate-pulse" />
                            Cooking in Oven (Preparing)
                          </span>
                          <h4 className="font-bold text-gray-900 text-lg flex items-center gap-1.5">
                            {req.productName}
                          </h4>
                          <span className="text-xs text-gray-700">
                            Batch Quantity: <strong className="text-amber-900 font-mono font-bold">{req.requestedQuantity} pcs</strong>
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-amber-900 bg-white/90 px-2 py-1 rounded border border-amber-300">
                          {req.id}
                        </span>
                      </div>

                      <div className="bg-white/90 p-3 rounded-lg border border-amber-200 text-xs text-gray-700 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cashier Current Counter Stock:</span>
                          <strong className="text-rose-600 font-bold">{req.currentStock} pcs remaining</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cooked By:</span>
                          <span className="font-medium text-gray-800">{bakerName}</span>
                        </div>
                        {recipe && (
                          <div className="pt-1.5 border-t border-amber-100">
                            <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                              Ingredients to Deduct Upon Completion:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {check.breakdown.map(b => (
                                <span key={b.ingredientId} className="px-1.5 py-0.5 bg-amber-100/70 text-amber-900 rounded text-[11px] font-mono">
                                  {b.ingredientName}: {b.required} {b.unit}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCompleteProduction(req)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:shadow-md"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Finish Cooking & Send to Cashier</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 2. CASHIER PASTRIES RUNNING LOW IN STOCK (NEEDS COOKING) */}
          {/* ========================================================= */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                  Cashier Pastries Running Low in Stock (Needs Cooking)
                </h3>
                <p className="text-xs text-gray-500">
                  Live finished pastry stock alerts from Cashier POS — click "Start Cooking" to bake a replenishment batch
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  cashierLowStockPastries.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {cashierLowStockPastries.length} Low Stock {cashierLowStockPastries.length === 1 ? 'Pastry' : 'Pastries'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('cashierStock')}
                  className="text-xs font-bold text-[#D81B60] hover:underline cursor-pointer"
                >
                  View All Cashier Stocks →
                </button>
              </div>
            </div>

            {cashierLowStockPastries.length === 0 ? (
              <div className="text-center py-8 text-gray-400 space-y-2 bg-emerald-50/40 rounded-xl border border-emerald-100 p-6">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                <h4 className="font-bold text-gray-800 text-sm">All Cashier Pastry Stocks are Healthy!</h4>
                <p className="text-xs text-gray-600 max-w-md mx-auto">
                  Every finished pastry at the cashier counter is currently above its minimum stock threshold. You can still cook ahead anytime using the full catalog monitor below.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cashierLowStockPastries.map(product => {
                  const batchSize = Number(product.productionBatchSize) || 30;
                  const minStock = product.minimumStock !== undefined ? Number(product.minimumStock) : 20;
                  const recipe = getRecipeForProduct({ id: product.id, name: product.name });
                  const check = checkIngredientsSufficiency(recipe, batchSize);
                  const activeReq = getActiveRequestForProduct(product);
                  const isCooking = activeReq && activeReq.status === 'Preparing';
                  const isReady = activeReq && activeReq.status === 'Ready for Cashier';
                  const isPending = activeReq && (activeReq.status === 'Pending' || activeReq.status === 'Accepted');
                  const isOutOfStock = Number(product.stock) === 0;

                  return (
                    <div 
                      key={product.id || product.name} 
                      className={`bg-white rounded-xl border p-4 space-y-3 transition-all ${
                        isCooking 
                          ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20' 
                          : isReady 
                          ? 'border-emerald-300 ring-2 ring-emerald-50 bg-emerald-50/20'
                          : isOutOfStock
                          ? 'border-rose-300 ring-2 ring-rose-50 shadow-xs'
                          : 'border-rose-200 shadow-xs'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl" role="img" aria-label={product.name}>
                            {product.icon || '🥐'}
                          </span>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-tight">{product.name}</h4>
                            <span className="text-[10px] text-gray-500 uppercase font-semibold">
                              {product.category}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isOutOfStock ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </div>

                      {/* Stock Situation & Progress Bar */}
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1.5 text-xs">
                        <div className="flex justify-between items-baseline">
                          <span className="text-gray-500 font-medium">Cashier Counter Stock:</span>
                          <div>
                            <span className={`font-mono font-extrabold text-base ${isOutOfStock ? 'text-rose-600' : 'text-rose-600'}`}>
                              {product.stock}
                            </span>
                            <span className="text-gray-400 text-xs ml-1">/ min {minStock} pcs</span>
                          </div>
                        </div>

                        {/* Visual stock bar */}
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isOutOfStock ? 'bg-rose-600' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, Math.round(((Number(product.stock) || 0) / (minStock || 20)) * 100))}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[11px] text-gray-500 pt-0.5">
                          <span>Standard Batch Size:</span>
                          <strong className="text-gray-800 font-mono font-bold">{batchSize} pcs</strong>
                        </div>
                      </div>

                      {/* Recipe & Pantry Ingredients Check */}
                      <div className={`p-2 rounded-lg text-xs ${
                        check.sufficient ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {check.sufficient ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Pantry ingredients ready for {batchSize} pcs</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5 text-[11px]">
                            <span className="font-bold flex items-center gap-1 text-rose-700">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Insufficient ingredients:
                            </span>
                            {check.shortages.map(s => (
                              <div key={s.ingredientId} className="text-[10px] pl-4 text-rose-800 font-mono">
                                • {s.ingredientName}: needs {s.required} {s.unit}, have {s.available} {s.unit}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Status indicator if active in queue */}
                      {activeReq && (
                        <div className="text-[11px] text-gray-600 flex items-center justify-between px-1">
                          <span className="text-gray-400">Status in Kitchen:</span>
                          <span className={`font-bold ${
                            isCooking ? 'text-amber-600 flex items-center gap-1' :
                            isReady ? 'text-emerald-600' :
                            'text-blue-600'
                          }`}>
                            {isCooking && <Flame className="w-3 h-3 animate-pulse" />}
                            {isCooking ? 'In Oven (Cooking)' : isReady ? 'Ready for Cashier' : activeReq.status}
                          </span>
                        </div>
                      )}

                      {/* Action Button */}
                      <div>
                        {isCooking ? (
                          <button
                            type="button"
                            onClick={() => handleCompleteProduction(activeReq)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Finish Cooking ({batchSize} pcs)</span>
                          </button>
                        ) : isReady ? (
                          <div className="w-full py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold text-center">
                            ✓ Baked & Ready on Pass
                          </div>
                        ) : isPending ? (
                          <button
                            type="button"
                            disabled={!check.sufficient}
                            onClick={() => handleStartProduction(activeReq.id)}
                            className="w-full py-2 bg-[#D81B60] hover:bg-[#C2185B] disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Start Cooking Batch ({batchSize} pcs)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!check.sufficient}
                            onClick={() => handleCookPastry(product)}
                            className="w-full py-2 bg-[#D81B60] hover:bg-[#C2185B] disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Cook Batch Now ({batchSize} pcs)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 3. CASHIER FINISHED PASTRY STOCK MONITOR (ALL ITEMS)     */}
          {/* ========================================================= */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-700" />
                  All Cashier Pastry Stock Monitor
                </h3>
                <p className="text-xs text-gray-500">Live finished inventory at the cashier counter — bake any pastry ahead of rushes</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL', label: `All (${cashierPastries.length})` },
                  { id: 'LOW_STOCK', label: `Low Stock (${cashierLowStockPastries.length})` },
                  { id: 'Bread', label: 'Bread' },
                  { id: 'Pastry', label: 'Pastry' },
                  { id: 'Cake', label: 'Cake' },
                  { id: 'Dessert', label: 'Dessert' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCashierCategoryFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      cashierCategoryFilter === tab.id
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pastry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredCashierPastries.slice(0, 18).map(product => {
                const stock = Number(product.stock) || 0;
                const minStock = product.minimumStock !== undefined ? Number(product.minimumStock) : 20;
                const isLow = stock <= minStock;
                const isOut = stock === 0;
                const activeReq = getActiveRequestForProduct(product);
                const isCooking = activeReq && activeReq.status === 'Preparing';

                return (
                  <div 
                    key={product.id || product.name} 
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      isOut ? 'border-rose-300 bg-rose-50/30' :
                      isLow ? 'border-amber-300 bg-amber-50/20' :
                      'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xl">{product.icon || '🥐'}</span>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                          isOut ? 'bg-rose-100 text-rose-800' :
                          isLow ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                        </span>
                      </div>
                      <h5 className="font-bold text-gray-900 text-xs truncate" title={product.name}>
                        {product.name}
                      </h5>
                      <span className="text-[10px] text-gray-400 block truncate">
                        {product.category} • {formatCurrency(product.price)}
                      </span>
                    </div>

                    <div className="pt-2 mt-2 border-t border-gray-100 space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-gray-500 text-[11px]">Stock:</span>
                        <span className={`font-mono font-extrabold ${isLow ? 'text-rose-600' : 'text-gray-900'}`}>
                          {stock} <span className="text-[10px] text-gray-400">/ {minStock}</span>
                        </span>
                      </div>

                      {isCooking ? (
                        <div className="w-full py-1 bg-amber-100 text-amber-800 rounded text-[10px] font-bold text-center flex items-center justify-center gap-1">
                          <Flame className="w-2.5 h-2.5 animate-pulse" /> In Oven
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCookPastry(product)}
                          className="w-full py-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Flame className="w-2.5 h-2.5 text-[#D81B60]" /> Cook
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. FRESHLY BAKED — WAITING FOR CASHIER PICKUP            */}
          {/* ========================================================= */}
          {readyRequests.length > 0 && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Freshly Baked Pastries on the Pass ({readyRequests.length} Batches)
                  </h4>
                </div>
                <span className="text-xs text-emerald-700 font-medium">
                  Awaiting Cashier to receive into counter stock
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {readyRequests.map(batch => (
                  <div key={batch.id} className="bg-white p-3 rounded-lg border border-emerald-200 space-y-1">
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-gray-900 text-sm">{batch.productName}</h5>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Ready
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 font-mono">
                      Quantity: <strong>{batch.requestedQuantity} pcs</strong>
                    </div>
                    <span className="text-[10px] text-gray-400 block pt-1">
                      Batch #{batch.id} • Completed by {bakerName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. PANTRY HEALTH GLANCE                                   */}
          {/* ========================================================= */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  <Wheat className="w-5 h-5 text-amber-600" />
                  Pantry Reserves & Ingredients Available
                </h3>
                <p className="text-xs text-gray-500">Raw materials managed by Store Owner and ready for kitchen use</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ingredients')}
                className="text-xs font-bold text-[#D81B60] hover:underline cursor-pointer"
              >
                View Full Ingredient Inventory →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {ingredients.slice(0, 6).map(ing => {
                const isLow = (Number(ing.quantity) || 0) <= (Number(ing.minimumStock) || 0);
                return (
                  <div key={ing.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block truncate">{ing.category}</span>
                    <h5 className="font-bold text-gray-800 text-xs truncate" title={ing.name}>{ing.name}</h5>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className={`text-base font-extrabold font-mono ${isLow ? 'text-rose-600' : 'text-gray-900'}`}>
                        {ing.quantity}
                      </span>
                      <span className="text-xs text-gray-500">{ing.unit}</span>
                    </div>
                    <span className={`text-[10px] font-bold block ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isLow ? '⚠️ Low Stock' : '✓ Available'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* 2. CASHIER PASTRY STOCK MONITOR TAB */}
      {/* ================================================= */}
      {activeTab === 'cashierStock' && (
        <div className="space-y-6">
          {/* Header Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border-light shadow-2xs">
              <span className="text-2xs font-bold text-muted block uppercase tracking-wider">Pastry Varieties</span>
              <span className="text-2xl font-black text-gray-800 block mt-1">{cashierPastries.length} items</span>
              <span className="text-xs text-muted block mt-0.5">Breads, pastries & cakes</span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-2xs">
              <span className="text-2xs font-bold text-rose-800 block uppercase tracking-wider flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                Low Stock at Cashier
              </span>
              <span className="text-2xl font-black text-rose-600 block mt-1">{cashierLowStockPastries.length}</span>
              <span className="text-xs text-rose-700 block mt-0.5">Needs baking urgently</span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs">
              <span className="text-2xs font-bold text-emerald-800 block uppercase tracking-wider">Healthy Stock</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">
                {cashierPastries.length - cashierLowStockPastries.length}
              </span>
              <span className="text-xs text-emerald-700 block mt-0.5">Above minimum level</span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-2xs">
              <span className="text-2xs font-bold text-amber-800 block uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                Currently Cooking
              </span>
              <span className="text-2xl font-black text-amber-600 block mt-1">{preparingRequests.length} batches</span>
              <span className="text-xs text-amber-700 block mt-0.5">In oven right now</span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search pastry by name..."
                value={cashierSearchQuery}
                onChange={(e) => setCashierSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#D81B60]/20 focus:border-[#D81B60] outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: `All (${cashierPastries.length})` },
                { id: 'LOW_STOCK', label: `Low Stock (${cashierLowStockPastries.length})` },
                { id: 'Bread', label: 'Bread' },
                { id: 'Pastry', label: 'Pastry' },
                { id: 'Cake', label: 'Cake' },
                { id: 'Dessert', label: 'Dessert' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCashierCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    cashierCategoryFilter === tab.id
                      ? 'bg-[#D81B60] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Pastries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCashierPastries.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-gray-300" />
                <h4 className="font-bold text-gray-700 text-sm">No Pastries Match Filter</h4>
                <p className="text-xs">Try selecting "All" or changing your search terms.</p>
              </div>
            ) : (
              filteredCashierPastries.map(product => {
                const stock = Number(product.stock) || 0;
                const minStock = product.minimumStock !== undefined ? Number(product.minimumStock) : 20;
                const batchSize = Number(product.productionBatchSize) || 30;
                const isLow = stock <= minStock;
                const isOut = stock === 0;
                const recipe = getRecipeForProduct({ id: product.id, name: product.name });
                const check = checkIngredientsSufficiency(recipe, batchSize);
                const activeReq = getActiveRequestForProduct(product);
                const isCooking = activeReq && activeReq.status === 'Preparing';
                const isReady = activeReq && activeReq.status === 'Ready for Cashier';
                const isPending = activeReq && (activeReq.status === 'Pending' || activeReq.status === 'Accepted');

                return (
                  <div
                    key={product.id || product.name}
                    className={`bg-white rounded-xl border p-4 space-y-3 flex flex-col justify-between transition-all ${
                      isCooking
                        ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/20'
                        : isReady
                        ? 'border-emerald-300 ring-2 ring-emerald-50 bg-emerald-50/20'
                        : isOut
                        ? 'border-rose-300 ring-2 ring-rose-50 shadow-xs'
                        : isLow
                        ? 'border-amber-200 shadow-xs'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{product.icon || '🥐'}</span>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{product.name}</h4>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold">
                              {product.category} • {formatCurrency(product.price)}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isOut ? 'bg-rose-600 text-white' :
                          isLow ? 'bg-rose-100 text-rose-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>

                      {/* Stock Situation */}
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 space-y-1.5 text-xs">
                        <div className="flex justify-between items-baseline">
                          <span className="text-gray-500 font-medium">Cashier Stock:</span>
                          <div>
                            <span className={`font-mono font-black text-base ${isLow ? 'text-rose-600' : 'text-gray-900'}`}>
                              {stock}
                            </span>
                            <span className="text-gray-400 text-xs ml-1">/ min {minStock} pcs</span>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isOut ? 'bg-rose-600' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, Math.round(((stock) / (minStock || 20)) * 100))}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[11px] text-gray-500 pt-0.5">
                          <span>Standard Batch Size:</span>
                          <strong className="text-gray-800 font-mono font-bold">{batchSize} pcs</strong>
                        </div>
                      </div>

                      {/* Recipe & Ingredients readiness */}
                      <div className={`p-2 rounded-lg text-xs ${
                        check.sufficient ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {check.sufficient ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Pantry ingredients ready ({batchSize} pcs)</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5 text-[11px]">
                            <span className="font-bold text-rose-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Shortage:
                            </span>
                            <div className="text-[10px] text-rose-800 font-mono">
                              Missing {check.shortages.map(s => s.ingredientName).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Queue Status if any */}
                      {activeReq && (
                        <div className="text-[11px] flex items-center justify-between px-1">
                          <span className="text-gray-400">Kitchen State:</span>
                          <span className={`font-bold ${
                            isCooking ? 'text-amber-600 flex items-center gap-1' :
                            isReady ? 'text-emerald-600' :
                            'text-blue-600'
                          }`}>
                            {isCooking && <Flame className="w-3 h-3 animate-pulse" />}
                            {isCooking ? 'In Oven (Cooking)' : isReady ? 'Ready for Cashier' : activeReq.status}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-gray-100">
                      {isCooking ? (
                        <button
                          type="button"
                          onClick={() => handleCompleteProduction(activeReq)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Finish Cooking & Send to Cashier</span>
                        </button>
                      ) : isReady ? (
                        <div className="w-full py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold text-center">
                          ✓ Baked & Awaiting Cashier Pickup
                        </div>
                      ) : isPending ? (
                        <button
                          type="button"
                          disabled={!check.sufficient}
                          onClick={() => handleStartProduction(activeReq.id)}
                          className="w-full py-2 bg-[#D81B60] hover:bg-[#C2185B] disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Start Cooking Batch ({batchSize} pcs)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!check.sufficient}
                          onClick={() => handleCookPastry(product)}
                          className="w-full py-2 bg-[#D81B60] hover:bg-[#C2185B] disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Cook Batch ({batchSize} pcs)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* 3. PRODUCTION QUEUE TAB */}
      {/* ================================================= */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search pastry request, request ID..."
                value={queueSearchQuery}
                onChange={(e) => setQueueSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#D81B60]/20 focus:border-[#D81B60] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {['ALL', 'Pending', 'Accepted', 'Preparing', 'Ready for Cashier', 'Completed'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setQueueStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    queueStatusFilter === st 
                      ? 'bg-[#D81B60] text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Grid */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 space-y-2">
                <Clock className="w-10 h-10 mx-auto text-gray-300" />
                <p className="font-semibold text-gray-700">No Production Requests Found</p>
                <p className="text-xs">No active production requests match your current filters.</p>
              </div>
            ) : (
              filteredRequests.map(req => {
                const recipe = getRecipeForProduct({ id: req.productId, name: req.productName });
                const check = checkIngredientsSufficiency(recipe, req.requestedQuantity);
                const isPreparing = req.status === 'Preparing';
                const isReady = req.status === 'Ready for Cashier';

                return (
                  <div 
                    key={req.id} 
                    className={`bg-white rounded-xl border shadow-sm p-5 space-y-4 transition-all ${
                      isPreparing 
                        ? 'border-amber-300 ring-2 ring-amber-100' 
                        : isReady 
                        ? 'border-emerald-300 ring-2 ring-emerald-50' 
                        : 'border-gray-100'
                    }`}
                  >
                    {/* Top Row: Pastry details & status badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-[#D81B60]">
                          <ChefHat className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-base">{req.productName}</h4>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              req.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' :
                              req.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {req.priority} Priority
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono">
                            Request #{req.id} • Triggered: {formatDateTime(req.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          req.status === 'Pending' ? 'bg-blue-100 text-blue-800' :
                          req.status === 'Accepted' ? 'bg-indigo-100 text-indigo-800' :
                          req.status === 'Preparing' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                          req.status === 'Ready for Cashier' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {req.status === 'Preparing' ? '🔥 Preparing / In Oven' : req.status}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Batch stats & Recipe Calculation Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left: Cashier stock vs Requested */}
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 text-xs">
                        <span className="font-bold text-gray-700 uppercase tracking-wider block text-[10px]">
                          Stock Situation
                        </span>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Cashier Available:</span>
                          <span className="font-mono font-bold text-rose-600">{req.currentStock} pcs</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Minimum Stock:</span>
                          <span className="font-mono font-bold text-gray-700">{req.minimumStock} pcs</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                          <span className="font-bold text-gray-700">Requested Batch:</span>
                          <span className="font-mono font-extrabold text-[#D81B60] text-sm">
                            {req.requestedQuantity} pcs
                          </span>
                        </div>
                      </div>

                      {/* Right: Recipe ingredient calculation & sufficiency */}
                      <div className="md:col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <Wheat className="w-3.5 h-3.5 text-amber-600" />
                            Recipe Consumption Formula ({req.requestedQuantity} pcs)
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            check.sufficient ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {check.sufficient ? '✓ Sufficient Supplies' : '⚠️ Shortage Detected'}
                          </span>
                        </div>

                        {recipe ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                            {check.breakdown.map(item => (
                              <div 
                                key={item.ingredientId} 
                                className={`p-2 rounded-lg border text-[11px] ${
                                  item.isSufficient ? 'bg-white border-gray-200 text-gray-800' : 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                                }`}
                              >
                                <span className="block font-bold truncate">{item.ingredientName}</span>
                                <div className="text-[10px] mt-0.5 font-mono">
                                  <span>Req: {item.required} {item.unit}</span>
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono">
                                  <span>Avail: {item.available} {item.unit}</span>
                                </div>
                                {!item.isSufficient && (
                                  <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                                    Short: -{item.shortage} {item.unit}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic py-2">No recipe found for this pastry. Standard batch will be produced without automatic ingredient deductions.</p>
                        )}

                        {/* Insufficient Shortage Banner */}
                        {!check.sufficient && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center justify-between gap-2 mt-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              <div>
                                <span className="font-bold">Insufficient ingredients. </span>
                                <span>Cannot start production. Missing: </span>
                                {check.shortages.map(s => `${s.ingredientName} (need ${s.required} ${s.unit}, available ${s.available} ${s.unit})`).join('; ')}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSendAdminAlert(check.shortages.map(s => s.ingredientName).join(', '))}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shrink-0 transition-colors"
                            >
                              Alert Admin
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <div className="text-gray-400">
                        {req.notes && <span>Notes: {req.notes}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status: Pending */}
                        {req.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAcceptRequest(req.id)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={!check.sufficient}
                              onClick={() => handleStartProduction(req.id)}
                              className="px-4 py-1.5 bg-[#D81B60] hover:bg-[#C2185B] disabled:opacity-40 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Start Production</span>
                            </button>
                          </>
                        )}

                        {/* Status: Accepted */}
                        {req.status === 'Accepted' && (
                          <button
                            type="button"
                            disabled={!check.sufficient}
                            onClick={() => handleStartProduction(req.id)}
                            className="px-4 py-1.5 bg-[#D81B60] hover:bg-[#C2185B] disabled:opacity-40 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start Production</span>
                          </button>
                        )}

                        {/* Status: Preparing */}
                        {req.status === 'Preparing' && (
                          <button
                            type="button"
                            onClick={() => handleCompleteProduction(req)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Mark Production Complete</span>
                          </button>
                        )}

                        {/* Status: Ready for Cashier */}
                        {req.status === 'Ready for Cashier' && (
                          <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>🟢 Ready for Cashier — Waiting for Cashier to receive</span>
                          </div>
                        )}

                        {/* Status: Completed / Received */}
                        {(req.status === 'Completed' || req.status === 'Received') && (
                          <div className="flex items-center gap-1.5 text-gray-500 font-semibold bg-gray-50 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Received by Cashier</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* 3. INGREDIENT INVENTORY TAB (VIEW-ONLY FOR BAKER) */}
      {/* ================================================= */}
      {activeTab === 'ingredients' && (
        <div className="space-y-6">
          {/* Header Notice */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Wheat className="w-6 h-6 text-blue-700 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-blue-900">
                  Raw Ingredient Inventory (Kitchen Pantry)
                </h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  The Baker does NOT manage or purchase supplies. The Store Owner / Admin manages procurement and restocks. This table is view-only for kitchen production planning.
                </p>
              </div>
            </div>
            {lowIngredientsCount > 0 && (
              <button
                type="button"
                onClick={() => handleSendAdminAlert(lowIngredients.map(i => i.name).join(', '))}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
              >
                Request Restock from Admin
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search raw ingredient name..."
                value={ingSearchQuery}
                onChange={(e) => setIngSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#D81B60]/20 focus:border-[#D81B60] outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={ingFilterCategory}
                onChange={(e) => setIngFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:border-[#D81B60] outline-none"
              >
                {ingredientCategories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ingredients Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-600 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Ingredient Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Available Stock</th>
                    <th className="py-3 px-4 text-right">Minimum Level</th>
                    <th className="py-3 px-4 text-right">Reorder Level</th>
                    <th className="py-3 px-4 text-center">Pantry Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-gray-400">
                        No ingredients found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map(ing => {
                      const qty = Number(ing.quantity) || 0;
                      const min = Number(ing.minimumStock) || 0;
                      const isLow = qty <= min;
                      const isOut = qty === 0;

                      return (
                        <tr key={ing.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-gray-900 block">{ing.name}</span>
                            {ing.notes && <span className="text-[11px] text-gray-400 block">{ing.notes}</span>}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-gray-600">
                            <span className="bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
                              {ing.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-sm">
                            <span className={`font-bold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                              {ing.quantity} {ing.unit}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs text-gray-500">
                            {ing.minimumStock} {ing.unit}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs text-gray-500">
                            {ing.reorderLevel || ing.minimumStock} {ing.unit}
                          </td>

                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isOut ? 'bg-rose-100 text-rose-800' :
                              isLow ? 'bg-amber-100 text-amber-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              <span>{isOut ? '🔴 Out of Stock' : isLow ? '🟡 Low Stock' : '🟢 In Stock'}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isLow && (
                              <button
                                type="button"
                                onClick={() => handleSendAdminAlert(ing.name)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-bold transition-colors"
                              >
                                Request Restock
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* 4. RECIPES TAB & SCALER */}
      {/* ================================================= */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#D81B60]" />
                Bakery Recipe Formulations & Quantity Scaler
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Calculate proportional ingredient usage using the formula: 
                <span className="font-mono bg-pink-50 text-[#D81B60] px-2 py-0.5 rounded ml-1 font-bold">
                  Required = (Recipe Qty × Production Qty) ÷ Base Qty
                </span>
              </p>
            </div>

            {/* Select Recipe Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Recipe to Inspect / Scale
                </label>
                <select
                  value={selectedRecipeId}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:border-[#D81B60] outline-none"
                >
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.productName} (Base Yield: {r.baseQuantity} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Production Quantity (pcs)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={scaleTargetQty}
                    onChange={(e) => setScaleTargetQty(Math.max(1, Number(e.target.value) || 1))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:border-[#D81B60] outline-none"
                  />
                  {[10, 20, 30, 50, 100].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setScaleTargetQty(q)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        scaleTargetQty === q ? 'bg-[#D81B60] text-white border-[#D81B60]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recipe Details & Scaling Matrix */}
          {currentRecipe && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{currentRecipe.productName}</h4>
                  <p className="text-xs text-gray-500 font-mono">
                    Standard Base Formulation: <strong>{currentRecipe.baseQuantity} pieces</strong>
                  </p>
                </div>
                <div className="text-xs text-gray-600 bg-pink-50 px-3 py-1.5 rounded-lg border border-pink-100 font-mono">
                  Scale Multiplier: <strong>{(scaleTargetQty / currentRecipe.baseQuantity).toFixed(2)}x</strong>
                </div>
              </div>

              {/* Table of ingredients */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4">Ingredient Name</th>
                      <th className="py-3 px-4 text-right">Base Recipe Amount ({currentRecipe.baseQuantity} pcs)</th>
                      <th className="py-3 px-4 text-right">Required for {scaleTargetQty} pcs</th>
                      <th className="py-3 px-4 text-right">Available in Pantry</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {scaledIngredients.map(item => (
                      <tr key={item.ingredientId} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-semibold text-gray-800">
                          {item.ingredientName}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-500">
                          {item.recipeQuantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-[#D81B60]">
                          {item.required} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-700">
                          {item.available} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.isSufficient ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sufficient
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Short -{item.shortage} {item.unit}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================= */}
      {/* 5. PRODUCTION HISTORY TAB */}
      {/* ================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#D81B60]" />
              Bakery Production Output History
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Audited records of completed batches, deducted ingredients, and status transition to cashier receiving.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-600 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4">Completed Date & Time</th>
                    <th className="py-3 px-4">Pastry Produced</th>
                    <th className="py-3 px-4 text-center">Batch Quantity</th>
                    <th className="py-3 px-4">Ingredients Deducted</th>
                    <th className="py-3 px-4">Baker</th>
                    <th className="py-3 px-4 text-center">Workflow Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productionBatches.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-gray-400">
                        No production batches recorded yet. Complete a production batch to view records here.
                      </td>
                    </tr>
                  ) : (
                    productionBatches.map(batch => (
                      <tr key={batch.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#D81B60]">
                          {batch.batchNumber || batch.id}
                        </td>

                        <td className="py-3.5 px-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                          {formatDateTime(batch.completedAt)}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {batch.productName}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-extrabold text-sm">
                          {batch.quantity} pcs
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs">
                          {batch.ingredientsUsed && batch.ingredientsUsed.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {batch.ingredientsUsed.map((ing, idx) => (
                                <span key={idx} className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-mono">
                                  {ing.name || ing.ingredientName}: {ing.quantity} {ing.unit}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">None logged</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-700 whitespace-nowrap">
                          {batch.producedBy || 'Baker'}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            batch.status === 'Ready for Cashier' ? 'bg-amber-100 text-amber-800' :
                            batch.status === 'Received' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {batch.status === 'Ready for Cashier' ? '🟢 Ready for Cashier' : '📥 Received by Cashier'}
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

      {/* ================================================= */}
      {/* 6. LOW INGREDIENT ALERTS TAB */}
      {/* ================================================= */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                Low Raw Ingredient Depletion Alerts
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Ingredients currently at or below their configured minimum threshold in the bakery pantry.
              </p>
            </div>
            {lowIngredients.length > 0 && (
              <button
                type="button"
                onClick={() => handleSendAdminAlert(lowIngredients.map(i => i.name).join(', '))}
                className="px-4 py-2 bg-[#D81B60] hover:bg-[#C2185B] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>Send Emergency Restock Alert to Admin</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {lowIngredients.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                <p className="font-semibold text-gray-800 text-base">All Raw Ingredients are Well Stocked!</p>
                <p className="text-xs">No pantry ingredients are currently below minimum thresholds.</p>
              </div>
            ) : (
              lowIngredients.map(ing => {
                const qty = Number(ing.quantity) || 0;
                const min = Number(ing.minimumStock) || 0;
                const deficit = Math.max(0, min - qty);

                return (
                  <div key={ing.id} className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                        <Wheat className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-base">{ing.name}</h4>
                          <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            {ing.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-1 font-mono">
                          <span>Current: <strong className="text-rose-600 font-bold">{qty} {ing.unit}</strong></span>
                          <span>Minimum: <strong>{min} {ing.unit}</strong></span>
                          <span>Reorder Level: <strong>{ing.reorderLevel || min} {ing.unit}</strong></span>
                        </div>
                        {deficit > 0 && (
                          <span className="text-xs text-rose-600 font-semibold mt-1 block">
                            ⚠️ Depleted by {deficit} {ing.unit} below minimum safety threshold.
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendAdminAlert(ing.name)}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      Alert Store Owner
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MANUAL BAKE MODAL */}
      <ManualProductionModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        products={products}
        onProductionStarted={(req, qty, directBatch) => {
          if (directBatch) {
            showToast(`✓ Fresh batch baked! ${qty} pcs ${directBatch.productName} completed & sent to Cashier.`, 'success');
          } else {
            showToast(`Batch for ${qty} pcs sent to oven queue!`, 'success');
          }
        }}
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
