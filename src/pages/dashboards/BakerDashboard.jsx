// ==========================================
// Jen's Pastry Shop - Baker Dashboard (Kitchen & Production)
// Connected Bakery Inventory & Recipe-Driven Production Workflow
// Section 5: Dashboard, Production Queue, Ingredient Inventory, Recipes, Production History, Low Ingredient Alerts, Logout
// ==========================================

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../../hooks/useShop.js';
import ShopManager from '../../patterns/ShopManager.js';
import { useAuth } from '../../context/useAuth.js';
import NotificationToast from '../../components/NotificationToast.jsx';
import ManualProductionModal from '../../components/baker/ManualProductionModal.jsx';
import { useBakeryWorkflow } from '../../hooks/useBakeryWorkflow.js';
import './BakeologyPos.css';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { 
  Flame, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  ChefHat, 
  Play, 
  CheckCircle2, 
  Wheat, 
  BookOpen, 
  Package, 
  Search, 
  TrendingDown, 
  Check, 
  Timer, 
  Bell, 
  LogOut,
  Sparkles
} from 'lucide-react';


const LOCAL_PASTRY_IMAGES = {
  'apple pie': '/products/apple-pie-slice.jpg',
  'apple pie slice': '/products/apple-pie-slice.jpg',
  'banana bread': '/products/banana-bread.jpg',
  'cheesecake': '/products/blueberry-cheesecake.jpg',
  'blueberry cheesecake': '/products/blueberry-cheesecake.jpg',
  'muffin': '/products/blueberry-muffin.jpg',
  'blueberry muffin': '/products/blueberry-muffin.jpg',
  'tart': '/products/blueberry-tart.jpg',
  'blueberry tart': '/products/blueberry-tart.jpg',
  'fruit tart': '/products/blueberry-tart.jpg',
  'brownie': '/products/brownie.jpg',
  'croissant': '/products/butter-croissant.jpg',
  'butter croissant': '/products/butter-croissant.jpg',
  'almond croissant': '/products/butter-croissant.jpg',
  'cheese bread': '/products/cheese-bread-roll.jpg',
  'cheese bread roll': '/products/cheese-bread-roll.jpg',
  'danish': '/products/cheese-danish.jpg',
  'cheese danish': '/products/cheese-danish.jpg',
  'chocolate cake': '/products/chocolate-cake-slice.jpg',
  'chocolate cake slice': '/products/chocolate-cake-slice.jpg',
  'chocolate chip cookie': '/products/chocolate-chip-cookie.jpg',
  'cookie': '/products/chocolate-chip-cookie.jpg',
  'chocolate croissant': '/products/chocolate-croissant.jpg',
  'pain au chocolat': '/products/chocolate-croissant.jpg',
  'chocolate cupcake': '/products/chocolate-cupcake.jpg',
  'cupcake': '/products/chocolate-cupcake.jpg',
  'cinnamon roll': '/products/cinnamon-roll.jpg',
  'egg tart': '/products/egg-tart.jpg',
  'ensaymada': '/products/ensaymada.jpg',
  'ube ensaymada': '/products/ensaymada.jpg',
  'oatmeal raisin cookie': '/products/oatmeal-raisin-cookie.jpg',
  'oatmeal cookie': '/products/oatmeal-raisin-cookie.jpg',
  'red velvet': '/products/red-velvet-cake-slice.jpg',
  'red velvet cake': '/products/red-velvet-cake-slice.jpg',
  'red velvet cake slice': '/products/red-velvet-cake-slice.jpg',
  'spanish bread': '/products/spanish-bread.jpg',
  'pandesal': '/products/spanish-bread.jpg',
  'ube pandesal': '/products/spanish-bread.jpg',
  'pan de coco': '/products/spanish-bread.jpg',
  'monay': '/products/spanish-bread.jpg',
  'loaf bread': '/products/banana-bread.jpg',
  'dinner rolls': '/products/cheese-bread-roll.jpg',
  'vanilla cupcake': '/products/vanilla-cupcake.jpg',
  'vanilla sponge cake': '/products/vanilla-cupcake.jpg',
  'carrot cake': '/products/apple-pie-slice.jpg',
  'ube cake': '/products/red-velvet-cake-slice.jpg',
  'pie': '/products/apple-pie-slice.jpg'
};

const getProductPhoto = (product) => {
  if (product?.imageUrl && !product.imageUrl.endsWith('.svg')) {
    return product.imageUrl;
  }
  const key = (product?.name || '').toLowerCase().trim();
  if (key && LOCAL_PASTRY_IMAGES[key]) return LOCAL_PASTRY_IMAGES[key];
  if (key) {
    for (const [k, url] of Object.entries(LOCAL_PASTRY_IMAGES)) {
      if (key.includes(k)) return url;
    }
  }
  return '/products/chocolate-cake-slice.jpg';
};

export default function BakerDashboard() {
  const { products, updateStock } = useShop();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate('/login');
    } catch (e) {
      navigate('/login');
    }
  };
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
    updateProductionRequestQuantity,
    startProduction,
    completeProduction,
    receiveProductionBatch,
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

  // Live ticker for 10-second oven countdown timer
  const [now, setNow] = useState(Date.now());
  const completedRef = useRef(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Web Audio chime for oven timer completion
  const playOvenChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch {
      // Audio autoplay policy or not supported
    }
  }, []);

  // Calculate remaining seconds for any active preparing batch (10-second timer)
  const getSecondsLeft = useCallback((req) => {
    if (!req || req.status !== 'Preparing') return 0;
    const startedAt = req.cookingStartedAt ? Number(req.cookingStartedAt) : (req.updatedAt ? new Date(req.updatedAt).getTime() : Date.now());
    const elapsed = Math.floor((now - startedAt) / 1000);
    return Math.max(0, 10 - elapsed);
  }, [now]);

  // Quantity to cook state per product (persists user's custom choice)
  const [cookQuantities, setCookQuantities] = useState({});

  const getTargetQty = useCallback((product) => {
    if (!product) return 30;
    const key = String(product.id || product.name);
    if (cookQuantities[key] !== undefined) {
      return cookQuantities[key];
    }
    return Number(product.productionBatchSize) || 30;
  }, [cookQuantities]);

  const setTargetQty = useCallback((product, newQty) => {
    const key = String(product.id || product.name);
    const val = Math.max(1, Math.min(1000, Number(newQty) || 1));
    setCookQuantities(prev => ({ ...prev, [key]: val }));
  }, []);

  const adjustTargetQty = useCallback((product, delta) => {
    const current = getTargetQty(product);
    setTargetQty(product, current + delta);
  }, [getTargetQty, setTargetQty]);

  // Auto-complete batches when 10-second timer reaches 0
  useEffect(() => {
    preparingRequests.forEach(req => {
      const secondsLeft = getSecondsLeft(req);
      if (secondsLeft === 0 && !completedRef.current.has(req.id)) {
        completedRef.current.add(req.id);
        try {
          const batch = completeProduction({
            requestId: req.id,
            productName: req.productName,
            productId: req.productId,
            quantity: req.requestedQuantity,
            bakerName
          });
          showToast(`🔔 Ding! 10s Baking complete for ${batch.quantity} pcs ${batch.productName}! Ingredients deducted. Status: Ready for Cashier.`, 'success');
          playOvenChime();
        } catch (err) {
          console.warn("Auto-baking completion warning:", err);
        }
      }
    });
  }, [now, preparingRequests, getSecondsLeft, completeProduction, bakerName, playOvenChime]);

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

  const handleStartProduction = (requestId, customQty = null) => {
    try {
      if (customQty !== null) {
        updateProductionRequestQuantity(requestId, customQty);
      }
      completedRef.current.delete(requestId);
      startProduction(requestId, bakerName);
      showToast('🔥 Oven started! 10-second baking countdown running.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCompleteProduction = (request) => {
    try {
      completedRef.current.add(request.id);
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

  // Start Cooking a pastry directly from the Low Stock counter view or Monitor
  const handleCookPastry = (product, customQty = null) => {
    try {
      const batchSize = customQty !== null ? Math.max(1, Number(customQty) || 30) : getTargetQty(product);
      const recipe = getRecipeForProduct({ id: product.id, name: product.name });
      
      // Ingredient check for this exact quantity
      const check = checkIngredientsSufficiency(recipe, batchSize);
      if (!check.sufficient) {
        const missingMsg = check.shortages.map(s => `${s.ingredientName} (needs ${s.required} ${s.unit}, have ${s.available} ${s.unit})`).join(', ');
        showToast(`Cannot cook ${batchSize} pcs ${product.name}: Insufficient ingredients in pantry. Missing: ${missingMsg}`, 'error');
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
      } else {
        updateProductionRequestQuantity(req.id, batchSize);
      }

      completedRef.current.delete(req.id);
      // Transition to Preparing ("Cooking in Oven" with 10s timer)
      startProduction(req.id, bakerName);
      showToast(`🔥 Oven started for ${batchSize} pcs of ${product.name}! 10-second baking timer started.`, 'success');
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

  // Put finished cooked batch directly into Cashier Stock and empty the baker pass
  const handlePutInCashierStock = (product, reqOrBatch, autoCookNext = false) => {
    try {
      if (!product && !reqOrBatch) return;
      const prodName = product?.name || reqOrBatch?.productName;
      const targetProduct = products.find(p => 
        (product?.id && String(p.id) === String(product.id)) || 
        (reqOrBatch?.productId && String(p.id) === String(reqOrBatch.productId)) ||
        (prodName && p.name && p.name.toLowerCase() === prodName.toLowerCase())
      ) || product;

      // 1. Locate matching batch in productionBatches
      const batch = productionBatches.find(b => 
        (reqOrBatch?.id && (b.id === reqOrBatch.id || b.requestId === reqOrBatch.id)) ||
        (b.status === 'Ready for Cashier' && (
          (targetProduct?.id && String(b.productId) === String(targetProduct.id)) || 
          (b.productName && prodName && b.productName.toLowerCase() === prodName.toLowerCase())
        ))
      );

      const qtyToAdd = Number(batch?.quantity || reqOrBatch?.requestedQuantity || reqOrBatch?.quantity || getTargetQty(targetProduct));

      // 2. Put into cashier stock via BakeryWorkflowManager or ShopManager
      if (batch) {
        receiveProductionBatch(batch.id, bakerName, ShopManager.getInstance());
      } else {
        const prevStock = Number(targetProduct?.stock) || 0;
        const newStock = prevStock + qtyToAdd;
        if (targetProduct?.id) {
          ShopManager.getInstance().updateStock(targetProduct.id, newStock);
        }
      }

      // 3. Ensure any active request is marked Received so the baker pass empties
      const activeReq = getActiveRequestForProduct(targetProduct);
      if (activeReq) {
        updateProductionRequestStatus(activeReq.id, 'Received');
        completedRef.current.delete(activeReq.id);
      }
      if (reqOrBatch?.id && reqOrBatch.id !== activeReq?.id && !reqOrBatch.batchNumber) {
        try {
          updateProductionRequestStatus(reqOrBatch.id, 'Received');
          completedRef.current.delete(reqOrBatch.id);
        } catch {
          // ignore if reqOrBatch was a batch object without request ID
        }
      }

      const updatedStock = (Number(targetProduct?.stock) || 0) + qtyToAdd;
      showToast(`✓ Put ${qtyToAdd} pcs ${targetProduct?.name || prodName} into Cashier Stock! Counter stock is now ${updatedStock} pcs.`, 'success');

      // 4. If requested, automatically start cooking a new batch with 10s timer
      if (autoCookNext) {
        setTimeout(() => {
          handleCookPastry(targetProduct, qtyToAdd);
        }, 120);
      }
    } catch (err) {
      console.error("handlePutInCashierStock error:", err);
      showToast(`Failed to put into cashier stock: ${err.message}`, 'error');
    }
  };

  // Bulk put all ready batches into cashier stock
  const handlePutAllReadyInCashierStock = () => {
    try {
      if (readyRequests.length === 0) return;
      let totalPcs = 0;
      readyRequests.forEach(req => {
        const prod = products.find(p => 
          String(p.id) === String(req.productId) || 
          (p.name && p.name.toLowerCase() === req.productName.toLowerCase())
        ) || { id: req.productId, name: req.productName };
        
        const qty = Number(req.requestedQuantity) || 30;
        totalPcs += qty;

        const batch = productionBatches.find(b => 
          b.requestId === req.id || 
          (b.status === 'Ready for Cashier' && (
            String(b.productId) === String(prod.id) || 
            (b.productName && b.productName.toLowerCase() === prod.name.toLowerCase())
          ))
        );

        if (batch) {
          receiveProductionBatch(batch.id, bakerName, ShopManager.getInstance());
        } else {
          const prev = Number(prod.stock) || 0;
          ShopManager.getInstance().updateStock(prod.id, prev + qty);
        }

        updateProductionRequestStatus(req.id, 'Received');
        completedRef.current.delete(req.id);
      });

      showToast(`✓ Transferred all ${readyRequests.length} batches (${totalPcs} pcs total) to Cashier Stock!`, 'success');
    } catch (err) {
      showToast(`Error transferring batches: ${err.message}`, 'error');
    }
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
    <div className="bakeology-pos-root">
      {/* 1. FLOATING DECORATIONS LAYER (Crisp Transparent PNGs from Cashier) */}
      <div className="pos-decorations-layer" aria-hidden="true">
        <img src="/decorations/pretzel.png" alt="" className="pos-decor-item decor-pretzel-top" />
        <img src="/decorations/croissant.png" alt="" className="pos-decor-item decor-croissant-top" />
        <img src="/decorations/cookie.png" alt="" className="pos-decor-item decor-cookie-center" />
        <img src="/decorations/brownie.png" alt="" className="pos-decor-item decor-brownie-bottom" />
        <img src="/decorations/pretzel.png" alt="" className="pos-decor-item decor-pretzel-bottom" />
        <img src="/decorations/croissant.png" alt="" className="pos-decor-item decor-croissant-bottom" />
      </div>

      {/* 2. 2-COLUMN BAKEOLOGY BAKER WORKSTATION */}
      <div className="bakeology-baker-grid">
        
        {/* =========================================================
            LEFT COLUMN: BRAND & PILL NAVIGATION BUTTONS
            ========================================================= */}
        <aside className="pos-sidebar-col">
          <Link to="/" className="pos-brand-wrap" title="Back to Storefront">
            <div className="pos-brand-logo-disc">
              <img 
                src="/logo.png" 
                alt="Bakeology" 
                className="pos-brand-logo-img" 
                onError={(e) => { e.target.onerror = null; e.target.src = '/icon-192.png'; }} 
              />
            </div>
            <span className="pos-brand-caption">BAKEOLOGY EST 2026</span>
          </Link>

          {/* Pill Navigation Buttons */}
          <nav className="pos-nav-pill-list">
            <button
              type="button"
              className={`pos-nav-pill-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Flame size={15} />
              <span>OVEN STATION</span>
              {preparingRequests.length > 0 && (
                <span className="pos-nav-badge" style={{ background: '#BE185D' }}>{preparingRequests.length}</span>
              )}
            </button>

            <button
              type="button"
              className={`pos-nav-pill-btn ${activeTab === 'cashierStock' ? 'active' : ''}`}
              onClick={() => setActiveTab('cashierStock')}
            >
              <Package size={15} />
              <span>CASHIER STOCK</span>
              {cashierLowStockPastries.length > 0 && (
                <span className="pos-nav-badge" style={{ background: '#BE185D' }}>{cashierLowStockPastries.length}</span>
              )}
            </button>

            <button
              type="button"
              className={`pos-nav-pill-btn ${activeTab === 'queue' ? 'active' : ''}`}
              onClick={() => setActiveTab('queue')}
            >
              <Clock size={15} />
              <span>BAKING QUEUE</span>
              {activeQueueCount > 0 && (
                <span className="pos-nav-badge" style={{ background: '#059669' }}>{activeQueueCount}</span>
              )}
            </button>

            <button
              type="button"
              className={`pos-nav-pill-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
              onClick={() => setActiveTab('ingredients')}
            >
              <Wheat size={15} />
              <span>PANTRY INVENTORY</span>
              {lowIngredientsCount > 0 && (
                <span className="pos-nav-badge" style={{ background: '#BE185D' }}>{lowIngredientsCount}</span>
              )}
            </button>

            <button
              type="button"
              className={`pos-nav-pill-btn ${activeTab === 'recipes' ? 'active' : ''}`}
              onClick={() => setActiveTab('recipes')}
            >
              <BookOpen size={15} />
              <span>RECIPES & SPECS</span>
            </button>

            <button
              type="button"
              className={`pos-nav-pill-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Layers size={15} />
              <span>BAKE HISTORY</span>
            </button>

            <button
              type="button"
              className={`pos-nav-pill-btn ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              <AlertTriangle size={15} />
              <span>PANTRY ALERTS</span>
              {lowIngredientsCount > 0 && (
                <span className="pos-nav-badge" style={{ background: '#BE185D' }}>{lowIngredientsCount}</span>
              )}
            </button>

            {/* Storefront Link Pill */}
            <Link to="/" className="pos-nav-pill-btn" style={{ background: '#ffffff', color: '#1a1a1a' }}>
              <ChefHat size={15} />
              <span>STOREFRONT VIEW</span>
            </Link>
          </nav>

          {/* User Profile & Logout at Sidebar Bottom */}
          <div className="pos-sidebar-footer">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white text-[#9D174D] flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                {bakerName[0]?.toUpperCase() || 'B'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-gray-900 truncate">{bakerName}</p>
                <span className="text-[10px] font-bold text-gray-600 block leading-tight">Master Baker</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-full text-gray-700 hover:text-rose-600 hover:bg-white/80 transition-colors shrink-0"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* =========================================================
            RIGHT COLUMN: MAIN BAKER WORKSTATION (Frosted Glass Panel)
            ========================================================= */}
        <main className="baker-main-workstation">
          {/* Header Card with Title and Pill + Manual Bake Batch Button */}
          <div className="baker-header-card">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                {activeTab === 'overview' && '🍳 Baker Cooking & Oven Workstation'}
                {activeTab === 'cashierStock' && '📦 Cashier Finished Pastry Stock Monitor'}
                {activeTab === 'queue' && '⏱️ Kitchen Production Queue'}
                {activeTab === 'ingredients' && '🌾 Raw Ingredient Pantry & Stock Levels'}
                {activeTab === 'recipes' && '📖 Bakery Recipes & Batch Yield Scaler'}
                {activeTab === 'history' && '📜 Audited Production & Baking History'}
                {activeTab === 'alerts' && '⚠️ Raw Material Depletion Alerts'}
              </h2>
              <p className="text-xs font-bold text-gray-600 mt-0.5">
                {activeTab === 'overview' && 'Real-time oven cooking, batch baking, and low-stock cashier pastry replenishment'}
                {activeTab === 'cashierStock' && 'Live finished pastry stock levels at the cashier counter needing baking'}
                {activeTab === 'queue' && 'Fulfill cashier low-stock requests with automated ingredient checking'}
                {activeTab === 'ingredients' && 'Available raw ingredients and supplies for baking'}
                {activeTab === 'recipes' && 'Formulations, base yields, and dynamic batch scaling calculations'}
                {activeTab === 'history' && 'Audited records of completed pastry batches and ingredient consumption'}
                {activeTab === 'alerts' && 'Pantry shortages requiring Store Owner / Admin purchase orders'}
              </p>
            </div>

            <button
              type="button"
              className="baker-pill-action-btn"
              onClick={() => setIsManualModalOpen(true)}
            >
              <ChefHat size={16} />
              <span>+ MANUAL BAKE BATCH</span>
            </button>
          </div>

                        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top 5 KPI Cards - Floating Frosted Glass Deck */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
              <div className="baker-kpi-card group min-w-0">
                <div className="flex items-center justify-between mb-1 gap-1 min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5 truncate">
                    In Oven
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-white shadow-2xs shrink-0">
                    <Flame className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-950 font-mono tracking-tight">{preparingRequests.length}</div>
                <div className="flex items-center justify-between mt-0.5 gap-1 min-w-0">
                  <span className="text-[11px] font-bold text-amber-800/80 truncate">Currently baking</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">Deck 1</span>
                </div>
              </div>

              <div className="baker-kpi-card group min-w-0">
                <div className="flex items-center justify-between mb-1 gap-1 min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5 truncate">
                    Cashier Low Stock
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-2xs shrink-0">
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-rose-950 font-mono tracking-tight">{cashierLowStockPastries.length}</div>
                <div className="flex items-center justify-between mt-0.5 gap-1 min-w-0">
                  <span className="text-[11px] font-bold text-rose-800/80 truncate">Needs baking</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 shrink-0">Urgent</span>
                </div>
              </div>

              <div className="baker-kpi-card group min-w-0">
                <div className="flex items-center justify-between mb-1 gap-1 min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5 truncate">
                    Awaiting Oven
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-2xs shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-blue-950 font-mono tracking-tight">{pendingRequests.length + acceptedRequests.length}</div>
                <div className="flex items-center justify-between mt-0.5 gap-1 min-w-0">
                  <span className="text-[11px] font-bold text-blue-800/80 truncate">Queued batches</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">In Line</span>
                </div>
              </div>

              <div className="baker-kpi-card group min-w-0">
                <div className="flex items-center justify-between mb-1 gap-1 min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5 truncate">
                    Ready for Cashier
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-2xs shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-950 font-mono tracking-tight">{readyRequests.length}</div>
                <div className="flex items-center justify-between mt-0.5 gap-1 min-w-0">
                  <span className="text-[11px] font-bold text-emerald-800/80 truncate">Fresh on pass</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">Counter</span>
                </div>
              </div>

              <div className="baker-kpi-card group col-span-2 sm:col-span-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-1 min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5 truncate">
                    Today's Output
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-400 to-pink-500 flex items-center justify-center text-white shadow-2xs shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-purple-950 font-mono tracking-tight">{totalBakedToday} <span className="text-sm font-bold text-purple-800">pcs</span></div>
                <div className="flex items-center justify-between mt-0.5 gap-1 min-w-0">
                  <span className="text-[11px] font-bold text-purple-800/80 truncate">Fresh baked today</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 shrink-0">Audited</span>
                </div>
              </div>
            </div>

            {/* Low Ingredient Warning Banner if any */}
            {lowIngredientsCount > 0 && (
              <div className="baker-panel-card bg-amber-50/70 border-amber-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-200/60 rounded-xl text-amber-900 shadow-2xs">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-950">
                      {lowIngredientsCount} Raw {lowIngredientsCount === 1 ? 'Ingredient is' : 'Ingredients are'} Running Low in Pantry
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5 font-medium">
                      {lowIngredients.map(i => `${i.name} (${i.quantity} ${i.unit} left)`).join(' • ')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className="baker-pill-action-btn text-xs py-2"
                >
                  <span>View Alerts & POs →</span>
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* 1. ACTIVE COOKING WORKSTATION (IN OVEN)                   */}
            {/* ========================================================= */}
            <div className={`baker-oven-deck ${preparingRequests.length === 0 ? 'baker-oven-idle' : 'baker-oven-baking'} space-y-4`}>
              <div className="flex items-center justify-between border-b border-orange-200/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${preparingRequests.length > 0 ? 'bg-orange-500 text-white shadow-sm' : 'bg-amber-100 text-amber-800'}`}>
                    <Flame className={`w-5 h-5 ${preparingRequests.length > 0 ? 'animate-bounce text-white' : 'text-amber-700'}`} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                      Patisserie Deck Oven (Chamber 1)
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        preparingRequests.length > 0 ? 'bg-orange-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {preparingRequests.length > 0 ? '🔥 ACTIVE BAKING' : '● PREHEATED 180°C'}
                      </span>
                    </h3>
                    <p className="text-xs font-semibold text-gray-600">
                      {preparingRequests.length > 0 
                        ? 'Active baking with live 10-second timer — auto-deducts raw ingredients upon completion and alerts cashier'
                        : 'Artisan deck oven preheated and ready for instant replenishment batches'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black font-mono ${
                  preparingRequests.length > 0 ? 'bg-orange-100 text-orange-950 border border-orange-300' : 'bg-white/80 text-gray-700 border border-amber-200'
                }`}>
                  {preparingRequests.length} Active in Oven
                </span>
              </div>

              {preparingRequests.length === 0 ? (
                <div className="p-8 text-center space-y-3 bg-white/60 rounded-2xl border border-amber-200/60 shadow-2xs">
                  <div className="w-14 h-14 bg-gradient-to-tr from-amber-100 to-orange-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-amber-200/50">
                    <ChefHat className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-base">Deck Oven is Ready for Next Batch</h4>
                    <p className="text-xs font-semibold text-gray-600 max-w-md mx-auto mt-1">
                      No pastries are currently baking. Pick a low-stock cashier item below to launch a 10-second replenishment bake, or configure a custom batch!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="baker-pill-action-btn"
                  >
                    <ChefHat size={16} />
                    <span>+ START CUSTOM BAKE BATCH</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {preparingRequests.map(req => {
                    const recipe = getRecipeForProduct({ id: req.productId, name: req.productName });
                    const check = checkIngredientsSufficiency(recipe, req.requestedQuantity);
                    const secondsLeft = getSecondsLeft(req);
                    const progressPercent = Math.min(100, Math.round(((10 - secondsLeft) / 10) * 100));
                    const photoUrl = getProductPhoto({ name: req.productName });

                    return (
                      <div 
                        key={req.id} 
                        className="bg-white/95 border-2 border-orange-400 rounded-2xl p-4 space-y-3 shadow-md relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl overflow-hidden shadow-xs border border-orange-200 shrink-0 bg-pink-50">
                              <img 
                                src={photoUrl} 
                                alt={req.productName} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 inline-flex items-center gap-1 mb-0.5">
                                <Flame className="w-3 h-3 text-orange-600 animate-pulse" />
                                Chamber Baking
                              </span>
                              <h4 className="font-black text-gray-900 text-base leading-tight">
                                {req.productName}
                              </h4>
                              <span className="text-xs text-gray-600 font-semibold">
                                Batch: <strong className="text-orange-950 font-mono font-black">{req.requestedQuantity} pcs</strong>
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-black text-orange-900 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200 shrink-0 truncate max-w-[120px]" title={`#${req.id}`}>
                            #{req.id}
                          </span>
                        </div>

                        {/* 10-Second Oven Baking Timer Display */}
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-3 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                                <Timer className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-black text-orange-950 block leading-tight">
                                  Oven Baking Timer (10 Seconds)
                                </span>
                                <span className="text-xs font-bold text-orange-800">
                                  {secondsLeft > 0 ? `${secondsLeft}s remaining until finish` : '✓ Baking Complete! Ready to Pass'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-2xl font-black text-orange-950 block leading-none">
                                00:{String(secondsLeft).padStart(2, '0')}
                              </span>
                              <span className="text-[10px] text-orange-700 font-extrabold">
                                {progressPercent}% completed
                              </span>
                            </div>
                          </div>

                          {/* Animated Baking Progress Bar */}
                          <div className="w-full bg-orange-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-300 ease-linear rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {recipe && (
                          <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/70 text-xs">
                            <span className="text-[10px] uppercase font-extrabold text-amber-900 block mb-1">
                              Ingredients to Deduct:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {check.breakdown.map(b => (
                                <span key={b.ingredientId} className="px-2 py-0.5 bg-white/90 text-amber-900 rounded-md text-[10px] font-mono font-bold border border-amber-200/80">
                                  {b.ingredientName}: {b.required} {b.unit}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCompleteProduction(req)}
                          className="baker-pill-finish-btn"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{secondsLeft > 0 ? `⚡ Complete Now (${secondsLeft}s left)` : '✓ Finish Cooking & Send to Cashier'}</span>
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
            <div className="baker-panel-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-rose-600" />
                    Cashier Pastries Running Low in Stock (Needs Cooking)
                  </h3>
                  <p className="text-xs font-semibold text-gray-500">
                    Live stock alerts from Cashier counter — click "Bake Batch" to replenish fresh pastries into cashier display
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    cashierLowStockPastries.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {cashierLowStockPastries.length} Low Stock {cashierLowStockPastries.length === 1 ? 'Pastry' : 'Pastries'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cashierStock')}
                    className="text-xs font-black text-[#BE185D] hover:underline cursor-pointer"
                  >
                    View All Cashier Stocks →
                  </button>
                </div>
              </div>

              {cashierLowStockPastries.length === 0 ? (
                <div className="text-center py-8 text-gray-400 space-y-2 bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <h4 className="font-black text-gray-800 text-sm">All Cashier Pastry Stocks are Healthy!</h4>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    Every finished pastry at the cashier counter is currently above its minimum stock threshold. You can still cook ahead anytime using the catalog monitor below.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cashierLowStockPastries.map(product => {
                    const targetQty = getTargetQty(product);
                    const minStock = product.minimumStock !== undefined ? Number(product.minimumStock) : 20;
                    const recipe = getRecipeForProduct({ id: product.id, name: product.name });
                    const check = checkIngredientsSufficiency(recipe, targetQty);
                    const activeReq = getActiveRequestForProduct(product);
                    const isCooking = activeReq && activeReq.status === 'Preparing';
                    const isReady = activeReq && activeReq.status === 'Ready for Cashier';
                    const isPending = activeReq && (activeReq.status === 'Pending' || activeReq.status === 'Accepted');
                    const isOutOfStock = Number(product.stock) === 0;
                    const secondsLeft = isCooking ? getSecondsLeft(activeReq) : 0;
                    const progressPercent = isCooking ? Math.min(100, Math.round(((10 - secondsLeft) / 10) * 100)) : 0;
                    const photoUrl = getProductPhoto(product);

                    return (
                      <div 
                        key={product.id || product.name} 
                        className={`baker-pastry-card ${
                          isCooking ? 'is-cooking' : isReady ? 'is-ready' : ''
                        }`}
                      >
                        <div>
                          {/* Top Header Row of Card */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                              {product.category}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              isOutOfStock ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isOutOfStock ? 'Sold Out' : `${product.stock} Left`}
                            </span>
                          </div>

                          {/* Food Photo Frame */}
                          <div className="baker-pastry-img-wrap">
                            <img 
                              src={photoUrl} 
                              alt={product.name} 
                              className="baker-pastry-img" 
                            />
                          </div>

                          {/* Pastry Title & Price */}
                          <div className="mt-2 text-center">
                            <h4 className="font-black text-gray-900 text-sm leading-tight">
                              {product.name}
                            </h4>
                            <span className="text-[11px] font-extrabold text-[#BE185D] mt-0.5 block">
                              Counter Stock: {product.stock} / min {minStock} pcs
                            </span>
                          </div>

                          {/* Stock Health Bar */}
                          <div className="w-full bg-rose-100 h-1.5 rounded-full overflow-hidden mt-2">
                            <div 
                              className={`h-full ${isOutOfStock ? 'bg-rose-600' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, Math.round(((Number(product.stock) || 0) / (minStock || 20)) * 100))}%` }}
                            />
                          </div>

                          {/* Pantry Ingredients Readiness Check */}
                          <div className={`p-2 rounded-xl text-xs mt-2.5 ${
                            check.sufficient ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80' : 'bg-rose-50 text-rose-800 border border-rose-200/80'
                          }`}>
                            {check.sufficient ? (
                              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Pantry Ready for {targetQty} pcs</span>
                              </div>
                            ) : (
                              <div className="space-y-0.5 text-[10px] text-center font-bold">
                                <span className="flex items-center justify-center gap-1 text-rose-700">
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" /> Insufficient ingredients
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stepper & Action Controls */}
                        <div className="space-y-2 pt-2 border-t border-gray-100/80">
                          {!isCooking && !isReady && (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-gray-600">Batch:</span>
                                <button
                                  type="button"
                                  onClick={() => adjustTargetQty(product, -5)}
                                  className="baker-stepper-btn"
                                  title="Decrease 5"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max="999"
                                  value={targetQty}
                                  onChange={(e) => setTargetQty(product, e.target.value)}
                                  className="w-10 text-center font-mono font-black text-xs py-1 border border-pink-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#BE185D]"
                                />
                                <button
                                  type="button"
                                  onClick={() => adjustTargetQty(product, 5)}
                                  className="baker-stepper-btn"
                                  title="Increase 5"
                                >
                                  +
                                </button>
                              </div>
                              <div className="flex items-center gap-1">
                                {[20, 30, 50].map(preset => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setTargetQty(product, preset)}
                                    className={`baker-preset-chip ${targetQty === preset ? 'active' : ''}`}
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {isCooking ? (
                            <div className="space-y-1.5">
                              <div className="bg-amber-100/80 border border-amber-300 p-2 rounded-xl text-xs space-y-1">
                                <div className="flex items-center justify-between text-amber-950 font-black">
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                    <span>Baking in Oven ({activeReq.requestedQuantity} pcs)</span>
                                  </span>
                                  <span className="font-mono text-xs bg-amber-200 px-1.5 py-0.5 rounded border border-amber-400">
                                    00:{String(secondsLeft).padStart(2, '0')}
                                  </span>
                                </div>
                                <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCompleteProduction(activeReq)}
                                className="baker-pill-finish-btn"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>{secondsLeft > 0 ? `⚡ Done (${secondsLeft}s)` : '✓ Finish & Pass'}</span>
                              </button>
                            </div>
                          ) : isReady ? (
                            <div className="space-y-1.5 w-full pt-0.5">
                              <div className="w-full py-1 px-2 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-[11px] font-black text-center flex items-center justify-center gap-1.5 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Baked {activeReq?.requestedQuantity || targetQty} pcs • Ready on Pass</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handlePutInCashierStock(product, activeReq, false)}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <Package className="w-4 h-4 shrink-0" />
                                <span>Put in Stocks on Cashier (+{activeReq?.requestedQuantity || targetQty} pcs)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePutInCashierStock(product, activeReq, true)}
                                className="w-full py-2 bg-gradient-to-r from-[#D81B60] to-rose-600 hover:from-[#C2185B] hover:to-rose-700 active:scale-[0.98] text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                                <span>Put in Stock & Cook New One (10s)</span>
                              </button>
                            </div>
                          ) : isPending ? (
                            <button
                              type="button"
                              disabled={!check.sufficient}
                              onClick={() => handleStartProduction(activeReq.id, targetQty)}
                              className="baker-pill-cook-btn"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span>START BAKE ({targetQty} PCS)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!check.sufficient}
                              onClick={() => handleCookPastry(product, targetQty)}
                              className="baker-pill-cook-btn"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span>BAKE {targetQty} PCS</span>
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
            <div className="baker-panel-card space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-700" />
                    All Cashier Pastry Stock Monitor
                  </h3>
                  <p className="text-xs font-semibold text-gray-500">Live finished inventory at the cashier counter — bake any pastry ahead of rushes</p>
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
                      className={`baker-pill-filter-btn ${cashierCategoryFilter === tab.id ? 'active' : ''}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pastry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {filteredCashierPastries.slice(0, 18).map(product => {
                  const stock = Number(product.stock) || 0;
                  const minStock = product.minimumStock !== undefined ? Number(product.minimumStock) : 20;
                  const isLow = stock <= minStock;
                  const isOut = stock === 0;
                  const targetQty = getTargetQty(product);
                  const recipe = getRecipeForProduct({ id: product.id, name: product.name });
                  const check = checkIngredientsSufficiency(recipe, targetQty);
                  const activeReq = getActiveRequestForProduct(product);
                  const isCooking = activeReq && activeReq.status === 'Preparing';
                  const isReady = activeReq && activeReq.status === 'Ready for Cashier';
                  const secondsLeft = isCooking ? getSecondsLeft(activeReq) : 0;
                  const progressPercent = isCooking ? Math.min(100, Math.round(((10 - secondsLeft) / 10) * 100)) : 0;
                  const photoUrl = getProductPhoto(product);

                  return (
                    <div 
                      key={product.id || product.name} 
                      className={`p-3 rounded-2xl border flex flex-col justify-between transition-all bg-white/90 min-w-0 ${
                        isCooking ? 'border-amber-400 ring-2 ring-amber-100 shadow-sm' :
                        isReady ? 'border-emerald-300 ring-1 ring-emerald-100 shadow-2xs' :
                        isOut ? 'border-rose-300' :
                        isLow ? 'border-amber-300' :
                        'border-pink-100 hover:border-pink-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            isOut ? 'bg-rose-100 text-rose-800' :
                            isLow ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold truncate">
                            {formatCurrency(product.price)}
                          </span>
                        </div>

                        <div className="w-full h-18 rounded-xl overflow-hidden bg-pink-50 my-1 shadow-2xs">
                          <img src={photoUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>

                        <h5 className="font-black text-gray-900 text-xs truncate mt-1" title={product.name}>
                          {product.name}
                        </h5>
                        <span className="text-[10px] text-gray-500 font-semibold block truncate">
                          {product.category}
                        </span>
                      </div>

                      <div className="pt-2 mt-2 border-t border-gray-100 space-y-1.5 min-w-0">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-gray-500 text-[11px] font-bold">Stock:</span>
                          <span className={`font-mono font-black ${isLow ? 'text-rose-600' : 'text-gray-900'}`}>
                            {stock} <span className="text-[10px] text-gray-400 font-normal">/ {minStock}</span>
                          </span>
                        </div>

                        {isCooking ? (
                          <div className="w-full py-1.5 px-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold text-center flex flex-col items-center justify-center gap-1 shadow-2xs">
                            <div className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-600 animate-pulse shrink-0" />
                              <span className="truncate">In Oven ({secondsLeft}s)</span>
                            </div>
                            <div className="w-full bg-amber-200/90 h-1 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : isReady ? (
                          <div className="space-y-1 w-full pt-0.5">
                            <button
                              type="button"
                              onClick={() => handlePutInCashierStock(product, activeReq, false)}
                              className="w-full py-1.5 px-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black text-center flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-colors truncate"
                              title="Put into Cashier Stock"
                            >
                              <Package className="w-3 h-3 shrink-0" />
                              <span className="truncate">Put in Stock (+{activeReq?.requestedQuantity || targetQty})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePutInCashierStock(product, activeReq, true)}
                              className="w-full py-1 px-1 bg-gradient-to-r from-[#D81B60] to-rose-600 hover:from-[#C2185B] hover:to-rose-700 text-white rounded-lg text-[9.5px] font-black text-center flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-colors truncate"
                              title="Put in Stock & Cook New One (10s)"
                            >
                              <Flame className="w-3 h-3 text-amber-300 animate-pulse shrink-0" />
                              <span className="truncate">Put in & Cook (10s)</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5 pt-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 min-w-0">
                              <span className="text-[10px] text-gray-500 font-bold shrink-0">Cook:</span>
                              <div className="flex items-center border border-pink-200 rounded-md overflow-hidden bg-white shadow-2xs shrink-0">
                                <button
                                  type="button"
                                  onClick={() => adjustTargetQty(product, -5)}
                                  className="px-1.5 py-0.5 text-gray-600 hover:bg-gray-100 text-xs font-bold leading-none cursor-pointer"
                                  title="Decrease 5"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max="999"
                                  value={targetQty}
                                  onChange={(e) => setTargetQty(product, e.target.value)}
                                  className="w-7 text-center font-mono font-bold text-[10.5px] py-0.5 border-x border-pink-200 focus:outline-none focus:ring-1 focus:ring-[#BE185D]"
                                />
                                <button
                                  type="button"
                                  onClick={() => adjustTargetQty(product, 5)}
                                  className="px-1.5 py-0.5 text-gray-600 hover:bg-gray-100 text-xs font-bold leading-none cursor-pointer"
                                  title="Increase 5"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={!check.sufficient}
                              onClick={() => handleCookPastry(product, targetQty)}
                              className="baker-pill-cook-btn text-[10.5px] py-1.5 w-full justify-center"
                            >
                              <Flame className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate">Cook {targetQty} pcs</span>
                            </button>
                          </div>
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
              <div className="baker-panel-card bg-emerald-50/60 border-emerald-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-black text-emerald-950 text-sm">
                        Freshly Baked Pastries on the Pass ({readyRequests.length} Batches)
                      </h4>
                      <p className="text-[11px] text-emerald-700 font-bold">
                        Ready to transfer into Cashier counter stock
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePutAllReadyInCashierStock}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Put All ({readyRequests.length}) in Cashier Stock</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {readyRequests.map(batch => {
                    const prod = products.find(p => 
                      String(p.id) === String(batch.productId) || 
                      (p.name && p.name.toLowerCase() === batch.productName.toLowerCase())
                    ) || { id: batch.productId, name: batch.productName };

                    return (
                      <div key={batch.id} className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h5 className="font-black text-gray-900 text-sm truncate" title={batch.productName}>{batch.productName}</h5>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 shrink-0">
                              Ready
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 font-mono mt-1">
                            Quantity: <strong className="text-emerald-950">{batch.requestedQuantity} pcs</strong>
                          </div>
                          <span className="text-[10px] text-gray-400 block pt-0.5">
                            Batch #{batch.id} • Completed by {bakerName}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-emerald-100 flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePutInCashierStock(prod, batch, false)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5 shrink-0" />
                            <span>Put in Cashier Stock (+{batch.requestedQuantity} pcs)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePutInCashierStock(prod, batch, true)}
                            className="w-full py-1.5 bg-gradient-to-r from-[#D81B60] to-rose-600 hover:from-[#C2185B] hover:to-rose-700 text-white rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                            <span>Put in Stock & Cook New One (10s)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 5. PANTRY HEALTH GLANCE                                   */}
            {/* ========================================================= */}
            <div className="baker-panel-card space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                    <Wheat className="w-5 h-5 text-amber-600" />
                    Pantry Reserves & Ingredients Available
                  </h3>
                  <p className="text-xs font-semibold text-gray-500">Raw materials managed by Store Owner and ready for kitchen use</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('ingredients')}
                  className="text-xs font-black text-[#BE185D] hover:underline cursor-pointer"
                >
                  View Full Ingredient Inventory →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {ingredients.slice(0, 6).map(ing => {
                  const isLow = (Number(ing.quantity) || 0) <= (Number(ing.minimumStock) || 0);
                  return (
                    <div key={ing.id} className="p-3 bg-white/80 rounded-2xl border border-pink-100 space-y-1 shadow-2xs">
                      <span className="text-[10px] uppercase font-black text-gray-400 block truncate">{ing.category}</span>
                      <h5 className="font-black text-gray-800 text-xs truncate" title={ing.name}>{ing.name}</h5>
                      <div className="flex items-baseline gap-1 pt-1">
                        <span className={`text-base font-black font-mono ${isLow ? 'text-rose-600' : 'text-gray-900'}`}>
                          {ing.quantity}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">{ing.unit}</span>
                      </div>
                      <span className={`text-[10px] font-black block ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
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
          <div className="baker-panel-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
                const targetQty = getTargetQty(product);
                const isLow = stock <= minStock;
                const isOut = stock === 0;
                const recipe = getRecipeForProduct({ id: product.id, name: product.name });
                const check = checkIngredientsSufficiency(recipe, targetQty);
                const activeReq = getActiveRequestForProduct(product);
                const isCooking = activeReq && activeReq.status === 'Preparing';
                const isReady = activeReq && activeReq.status === 'Ready for Cashier';
                const isPending = activeReq && (activeReq.status === 'Pending' || activeReq.status === 'Accepted');
                const secondsLeft = isCooking ? getSecondsLeft(activeReq) : 0;
                const progressPercent = isCooking ? Math.min(100, Math.round(((10 - secondsLeft) / 10) * 100)) : 0;

                return (
                  <div
                    key={product.id || product.name}
                    className={`bg-white rounded-xl border p-4 space-y-3 flex flex-col justify-between transition-all min-w-0 ${
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
                    <div className="space-y-2.5 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-2xs border border-pink-200 shrink-0 bg-pink-50"><img src={getProductPhoto(product)} alt={product.name} className="w-full h-full object-cover" /></div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm truncate" title={product.name}>{product.name}</h4>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">
                              {product.category} • {formatCurrency(product.price)}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
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
                          <span>Target to Bake:</span>
                          <strong className="text-gray-800 font-mono font-bold">{targetQty} pcs</strong>
                        </div>
                      </div>

                      {/* Recipe & Ingredients readiness */}
                      <div className={`p-2 rounded-lg text-xs ${
                        check.sufficient ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {check.sufficient ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">Pantry ingredients ready ({targetQty} pcs)</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5 text-[11px]">
                            <span className="font-bold text-rose-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" /> Shortage:
                            </span>
                            <div className="text-[10px] text-rose-800 font-mono break-words">
                              Missing {check.shortages.map(s => s.ingredientName).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Queue Status if any */}
                      {activeReq && (
                        <div className="text-[11px] flex items-center justify-between px-1">
                          <span className="text-gray-400">Kitchen State:</span>
                          <span className={`font-bold truncate ${
                            isCooking ? 'text-amber-600 flex items-center gap-1' :
                            isReady ? 'text-emerald-600' :
                            'text-blue-600'
                          }`}>
                            {isCooking && <Flame className="w-3 h-3 animate-pulse shrink-0" />}
                            {isCooking ? `In Oven (${secondsLeft}s left)` : isReady ? 'Ready for Cashier' : activeReq.status}
                          </span>
                        </div>
                      )}

                      {/* Quantity Stepper (if not cooking and not ready) */}
                      {!isCooking && !isReady && (
                        <div className="flex items-center justify-between gap-1.5 bg-gray-50 p-2 rounded-lg border border-gray-200 min-w-0">
                          <span className="text-[11px] font-semibold text-gray-600 shrink-0">To cook:</span>
                          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white shadow-2xs shrink-0">
                            <button
                              type="button"
                              onClick={() => adjustTargetQty(product, -5)}
                              className="px-2 py-0.5 text-gray-700 hover:bg-gray-100 font-bold text-xs cursor-pointer"
                              title="Decrease 5"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={targetQty}
                              onChange={(e) => setTargetQty(product, e.target.value)}
                              className="w-10 text-center font-mono font-bold text-xs py-0.5 border-x border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#D81B60]"
                            />
                            <button
                              type="button"
                              onClick={() => adjustTargetQty(product, 5)}
                              className="px-2 py-0.5 text-gray-700 hover:bg-gray-100 font-bold text-xs cursor-pointer"
                              title="Increase 5"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button & 10s Timer */}
                    <div className="pt-2 border-t border-gray-100">
                      {isCooking ? (
                        <div className="space-y-1.5">
                          <div className="bg-amber-100 border border-amber-300 p-2 rounded-lg text-xs space-y-1">
                            <div className="flex items-center justify-between text-amber-900 font-bold">
                              <span className="flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                                <span className="truncate">Baking ({activeReq.requestedQuantity} pcs)</span>
                              </span>
                              <span className="font-mono text-sm bg-amber-200/90 px-1.5 py-0.5 rounded border border-amber-400 shrink-0">
                                00:{String(secondsLeft).padStart(2, '0')}
                              </span>
                            </div>
                            <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCompleteProduction(activeReq)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{secondsLeft > 0 ? `⚡ Complete Now (${secondsLeft}s left)` : 'Finish Cooking & Send to Cashier'}</span>
                          </button>
                        </div>
                      ) : isReady ? (
                        <div className="space-y-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => handlePutInCashierStock(product, activeReq, false)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5 shrink-0" />
                            <span>Put in Cashier Stock (+{activeReq?.requestedQuantity || targetQty} pcs)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePutInCashierStock(product, activeReq, true)}
                            className="w-full py-1.5 bg-gradient-to-r from-[#D81B60] to-rose-600 hover:from-[#C2185B] hover:to-rose-700 text-white rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <Flame className="w-3.5 h-3.5 shrink-0 text-amber-300 animate-pulse" />
                            <span>Put in Stock & Cook New One (10s)</span>
                          </button>
                        </div>
                      ) : isPending ? (
                        <button
                          type="button"
                          disabled={!check.sufficient}
                          onClick={() => handleStartProduction(activeReq.id, targetQty)}
                          className="w-full py-2 bg-[#D81B60] hover:bg-[#C2185B] disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Start Cooking Batch ({targetQty} pcs)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!check.sufficient}
                          onClick={() => handleCookPastry(product, targetQty)}
                          className="w-full py-2 bg-[#D81B60] hover:bg-[#C2185B] disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Cook Batch ({targetQty} pcs)</span>
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
          <div className="baker-panel-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-xs border border-pink-200 shrink-0 bg-pink-50">
                          <img src={getProductPhoto({ name: req.productName })} alt={req.productName} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-gray-900 text-base truncate" title={req.productName}>{req.productName}</h4>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              req.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' :
                              req.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {req.priority} Priority
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono block truncate">
                            Request #{req.id} • Triggered: {formatDateTime(req.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
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
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                            <div className="flex items-start sm:items-center gap-2 min-w-0">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
                              <div className="min-w-0 break-words">
                                <span className="font-bold">Insufficient ingredients. </span>
                                <span>Cannot start production. Missing: </span>
                                <span className="font-mono">{check.shortages.map(s => `${s.ingredientName} (need ${s.required} ${s.unit}, available ${s.available} ${s.unit})`).join('; ')}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSendAdminAlert(check.shortages.map(s => s.ingredientName).join(', '))}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shrink-0 transition-colors self-start sm:self-auto cursor-pointer"
                            >
                              Alert Admin
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                      <div className="text-gray-400 min-w-0 truncate">
                        {req.notes && <span>Notes: {req.notes}</span>}
                      </div>

                      <div className="flex items-center flex-wrap gap-2">
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
                        {req.status === 'Preparing' && (() => {
                          const secondsLeft = getSecondsLeft(req);
                          return (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded-md flex items-center gap-1">
                                <Timer className="w-3.5 h-3.5 text-amber-700 animate-spin" style={{ animationDuration: '4s' }} />
                                00:{String(secondsLeft).padStart(2, '0')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCompleteProduction(req)}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>{secondsLeft > 0 ? `⚡ Complete Now (${secondsLeft}s left)` : 'Mark Production Complete'}</span>
                              </button>
                            </div>
                          );
                        })()}

                        {/* Status: Ready for Cashier */}
                        {req.status === 'Ready for Cashier' && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                const prod = products.find(p => String(p.id) === String(req.productId) || p.name.toLowerCase() === req.productName.toLowerCase());
                                handlePutInCashierStock(prod || { id: req.productId, name: req.productName }, req, false);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>Put in Cashier Stock (+{req.requestedQuantity} pcs)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const prod = products.find(p => String(p.id) === String(req.productId) || p.name.toLowerCase() === req.productName.toLowerCase());
                                handlePutInCashierStock(prod || { id: req.productId, name: req.productName }, req, true);
                              }}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-[#D81B60] to-rose-600 hover:from-[#C2185B] hover:to-rose-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                            >
                              <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                              <span>Put in & Cook New One (10s)</span>
                            </button>
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
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors self-start sm:self-auto cursor-pointer"
              >
                Request Restock from Admin
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="baker-panel-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
          <div className="baker-panel-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
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
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    type="number"
                    min="1"
                    value={scaleTargetQty}
                    onChange={(e) => setScaleTargetQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-24 sm:flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:border-[#D81B60] outline-none"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[10, 20, 30, 50, 100].map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setScaleTargetQty(q)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
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
          </div>

          {/* Recipe Details & Scaling Matrix */}
          {currentRecipe && (
            <div className="baker-panel-card space-y-4">
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
                <table className="w-full min-w-[540px] text-left text-sm">
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
              <table className="w-full min-w-[680px] text-left text-sm">
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
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                <span>Low Raw Ingredient Depletion Alerts</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Ingredients currently at or below their configured minimum threshold in the bakery pantry.
              </p>
            </div>
            {lowIngredients.length > 0 && (
              <button
                type="button"
                onClick={() => handleSendAdminAlert(lowIngredients.map(i => i.name).join(', '))}
                className="px-4 py-2 bg-[#D81B60] hover:bg-[#C2185B] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Bell className="w-4 h-4 shrink-0" />
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
                  <div key={ing.id} className="bg-white p-4 sm:p-5 rounded-xl border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                        <Wheat className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-base">{ing.name}</h4>
                          <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                            {ing.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-600 mt-1 font-mono flex-wrap">
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
                      className="px-4 py-2 bg-[#BE185D] hover:bg-[#9D174D] text-white rounded-full text-xs font-black shrink-0 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
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

        </main>
      </div>

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
    </div>
  );
}
