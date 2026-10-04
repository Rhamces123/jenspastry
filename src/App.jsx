// ==========================================
// BAKEOLOGY - Main Application Component
// College JavaScript & Design Patterns Project
// ==========================================

import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import BottomNavigation from './components/BottomNavigation.jsx';
import ProductFormModal from './components/ProductFormModal.jsx';
import QuickRestockModal from './components/QuickRestockModal.jsx';
import ReceiptModal from './components/ReceiptModal.jsx';
import NotificationToast from './components/NotificationToast.jsx';
import InstallAppModal from './components/InstallAppModal.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Inventory from './pages/Inventory.jsx';
import Sales from './pages/Sales.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import MyAccount from './pages/MyAccount.jsx';
import MyOrders from './pages/MyOrders.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import WelcomeGateway from './components/WelcomeGateway.jsx';
import CustomerDashboard from './pages/dashboards/CustomerDashboard.jsx';
import CashierDashboard from './pages/dashboards/CashierDashboard.jsx';
import BakerDashboard from './pages/dashboards/BakerDashboard.jsx';
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx';
import { ROLES, getDashboardPathForRole } from './constants/roles.js';

import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth.js';
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, addDoc } from 'firebase/firestore';

import { useShop } from './hooks/useShop.js';
import { 
  isStandaloneMode, 
  checkIsAppInstalled, 
  markAppAsInstalled, 
  clearAppInstalledState 
} from './utils/pwa.js';
import { Smartphone, Monitor } from 'lucide-react';
import './App.css';

export default function App() {
  // SINGLETON PATTERN
  // Access centralized pastry shop manager via the custom hook
  const {
    products,
    sales,
    summary,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    completeSale,
    resetToDefaultData
  } = useShop();

  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();

  // VARIABLES: Navigation & Modal UI states
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'products' | 'inventory' | 'sales'
  const [cart, setCart] = useState([]);

  // Derive currentTab from URL query parameter or fallback to activeTab
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  const currentTab = (location.pathname === '/' && tabParam && ['dashboard', 'products', 'inventory', 'sales'].includes(tabParam))
    ? tabParam
    : activeTab;

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState(null);

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(checkIsAppInstalled);

  // Toast feedback
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Toast on successful account registration
  useEffect(() => {
    if (location.state?.accountCreated) {
      const timer = setTimeout(() => {
        showToast("Account created successfully! Welcome to BAKEOLOGY.", "success");
        navigate(location.pathname, { replace: true, state: {} });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, location.pathname]);

  // Capture PWA Install Prompt & Track Installation Lifecycle
  useEffect(() => {
    // 1. Capture direct install prompt (only available if app is NOT already installed)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // If browser offers install prompt and we are not in standalone mode, reset installed state
      if (!isStandaloneMode()) {
        clearAppInstalledState();
        setIsAppInstalled(false);
      }
    };

    // 2. Listen for 'appinstalled' event fired by the browser when installation completes
    const handleAppInstalled = () => {
      markAppAsInstalled();
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
      showToast("App installed successfully! Welcome to BAKEOLOGY.", "success");
    };

    // 3. Listen for standalone display-mode changes
    const standaloneQuery = window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        markAppAsInstalled();
        setIsAppInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (standaloneQuery?.addEventListener) {
      standaloneQuery.addEventListener('change', handleDisplayModeChange);
    } else if (standaloneQuery?.addListener) {
      standaloneQuery.addListener(handleDisplayModeChange);
    }

    // 4. Query navigator.getInstalledRelatedApps if supported (Chromium browsers)
    if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
      navigator.getInstalledRelatedApps().then((relatedApps) => {
        if (relatedApps && relatedApps.length > 0) {
          markAppAsInstalled();
          setIsAppInstalled(true);
        }
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (standaloneQuery?.removeEventListener) {
        standaloneQuery.removeEventListener('change', handleDisplayModeChange);
      } else if (standaloneQuery?.removeListener) {
        standaloneQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  // Mobile frame simulator mode for desktop browsers
  const [deviceFrameMode, setDeviceFrameMode] = useState(true);

  // FUNCTIONS: Product Form Submission (Factory Pattern)
  const handleFormSubmit = (productData) => {
    try {
      if (editingProduct) {
        updateProduct(editingProduct.id, productData);
        showToast(`"${productData.name}" updated successfully!`, 'success');
      } else {
        // FACTORY PATTERN
        // Dispatches new product data through Factory instantiation
        addProduct(productData);
        showToast(`"${productData.name}" created via Factory Pattern!`, 'success');
      }
      setIsFormModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  // FUNCTIONS: Delete Product with validation
  const handleDeleteProduct = (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProduct(product.id);
      // Remove from cart if present
      setCart(prev => prev.filter(item => item.product.id !== product.id));
      showToast(`"${product.name}" deleted from catalog.`, 'info');
    }
  };

  // FUNCTIONS: Quick Add to Cart from catalog
  const handleQuickAddToCart = (product) => {
    if (product.stock <= 0) {
      showToast(`"${product.name}" is out of stock!`, 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Cannot add more than available stock (${product.stock}).`, 'error');
          return prev;
        }
        showToast(`Added another "${product.name}" to cart.`, 'success');
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        showToast(`"${product.name}" added to cart.`, 'success');
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  // FUNCTIONS: Inventory Restock confirmation
  const handleConfirmRestock = (productId, newStock) => {
    try {
      const updated = updateStock(productId, newStock);
      showToast(`Restocked "${updated.name}" to ${newStock} units!`, 'success');
    } catch (err) {
      showToast(err.message || 'Restock failed', 'error');
    }
  };

  // FUNCTIONS: Complete Sale (Strategy Pattern + Firestore Order Sync)
  const handleCompleteSale = (saleOptions) => {
    try {
      // STRATEGY PATTERN: Executes discount calculation and updates Singleton inventory
      const recordedSale = completeSale(saleOptions);
      setActiveReceiptSale(recordedSale);
      setIsReceiptModalOpen(true);
      showToast(`Sale #${recordedSale.saleNumber} completed successfully!`, 'success');

      // Sync completed order to Cloud Firestore & customer cache if authenticated
      if (currentUser) {
        const orderRecord = {
          id: recordedSale.id,
          saleNumber: recordedSale.saleNumber,
          userId: currentUser.uid,
          customerName: userProfile?.fullName || currentUser.displayName || 'Customer',
          customerEmail: currentUser.email || '',
          date: recordedSale.date,
          customerType: recordedSale.customerType,
          discountStrategyId: recordedSale.discountStrategyId,
          subtotal: recordedSale.subtotal,
          discount: recordedSale.discount,
          total: recordedSale.total,
          orderStatus: 'Confirmed',
          items: recordedSale.items.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            price: item.price,
            quantity: item.quantity,
            lineTotal: item.lineTotal
          }))
        };

        if (isFirebaseConfigured() && db) {
          addDoc(collection(db, 'orders'), orderRecord)
            .then(docRef => console.log('Order synced to Firestore:', docRef.id))
            .catch(err => console.warn('Could not sync order to Firestore:', err));
        }

        // Cache order in user's localStorage
        try {
          const key = `bakeology_customer_orders_${currentUser.uid}`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          localStorage.setItem(key, JSON.stringify([orderRecord, ...existing]));
        } catch (e) {
          console.warn('Could not cache user order locally:', e);
        }
      }
    } catch (err) {
      showToast(err.message || 'Checkout failed', 'error');
    }
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (location.pathname !== '/') {
      navigate(`/?tab=${tabId}`);
    } else {
      navigate(`/?tab=${tabId}`, { replace: true });
    }
  };

  const handleViewReceipt = (sale) => {
    setActiveReceiptSale(sale);
    setIsReceiptModalOpen(true);
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isDashboardRoute = location.pathname.includes('/dashboard');

  return (
    <div className={`app-viewport-root ${deviceFrameMode && !isDashboardRoute ? 'mode-phone-frame' : 'mode-expanded'} ${isDashboardRoute ? 'is-dashboard-route' : ''}`}>
      {/* Desktop Helper Bar: Allows toggling between Phone Frame & Full Width (Storefront only) */}
      {!isDashboardRoute && (
        <aside className="desktop-helper-bar" aria-label="Desktop Preview Controls">
          <div className="desktop-helper-content">
            <span className="text-xs text-muted font-medium">Mobile Viewport Simulator:</span>
            <button
              type="button"
              className={`btn-view-toggle ${deviceFrameMode ? 'btn-view-toggle-active' : ''}`}
              onClick={() => setDeviceFrameMode(true)}
              title="Simulate iPhone / Android Phone Frame"
            >
              <Smartphone size={14} /> Phone Frame
            </button>
            <button
              type="button"
              className={`btn-view-toggle ${!deviceFrameMode ? 'btn-view-toggle-active' : ''}`}
              onClick={() => setDeviceFrameMode(false)}
              title="Expand to Full Width"
            >
              <Monitor size={14} /> Full Width
            </button>
          </div>
        </aside>
      )}

      {/* Main Mobile App Container */}
      <main className={`mobile-phone-container ${isDashboardRoute ? 'dashboard-container' : ''}`}>
        {/* Device Notch & Status Bar (Simulated Phone Feel - only on storefront) */}
        {!isDashboardRoute && (
          <>
            <div className="mobile-status-bar">
              <span className="status-time">9:41</span>
              <div className="phone-camera-notch"></div>
              <div className="status-icons">
                <span className="text-2xs font-bold mr-1">5G</span>
                <span>🔋</span>
              </div>
            </div>

            {/* Application Header */}
            <Header onResetData={resetToDefaultData} />
          </>
        )}

        {/* Dynamic Main Body Content & Routes */}
        <div className={`mobile-scrollable-body ${isDashboardRoute ? 'p-0 h-full overflow-y-auto' : ''}`}>
          <Routes>
            {/* Storefront Home: If logged in, redirect to user role's dedicated dashboard */}
            <Route path="/" element={
              !currentUser ? (
                <WelcomeGateway
                  onOpenInstallModal={() => setIsInstallModalOpen(true)}
                  isInstalled={isAppInstalled}
                />
              ) : (
                <Navigate to={getDashboardPathForRole(userProfile?.role)} replace />
              )
            } />

            {/* Authentication Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* 4 Dedicated Role-Based Dashboards */}
            <Route path="/customer/dashboard" element={
              <RoleRoute allowedRoles={[ROLES.CUSTOMER]}>
                <CustomerDashboard />
              </RoleRoute>
            } />
            <Route path="/cashier/dashboard" element={
              <RoleRoute allowedRoles={[ROLES.CASHIER, ROLES.ADMIN]}>
                <CashierDashboard />
              </RoleRoute>
            } />
            <Route path="/baker/dashboard" element={
              <RoleRoute allowedRoles={[ROLES.BAKER, ROLES.ADMIN]}>
                <BakerDashboard />
              </RoleRoute>
            } />
            <Route path="/admin/dashboard" element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminDashboard />
              </RoleRoute>
            } />

            {/* Protected Customer Account & Orders */}
            <Route path="/account" element={
              <ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN]}>
                <MyAccount />
              </ProtectedRoute>
            } />
            <Route path="/my-orders" element={
              <ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN]}>
                <MyOrders />
              </ProtectedRoute>
            } />

            {/* Fallback to homepage */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Fixed Mobile Bottom Navigation (Only visible for logged in customers on main store tabs) */}
        {currentUser && !isDashboardRoute && location.pathname === '/' && (
          <BottomNavigation
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            cartCount={totalCartCount}
          />
        )}

        {/* Modals & Overlays */}
        {isFormModalOpen && (
          <ProductFormModal
            key={editingProduct ? `edit-${editingProduct.id}` : 'new-product'}
            isOpen={isFormModalOpen}
            onClose={() => {
              setIsFormModalOpen(false);
              setEditingProduct(null);
            }}
            onSubmit={handleFormSubmit}
            initialProduct={editingProduct}
          />
        )}

        <QuickRestockModal
          isOpen={isRestockModalOpen}
          onClose={() => {
            setIsRestockModalOpen(false);
            setRestockingProduct(null);
          }}
          product={restockingProduct}
          onConfirm={handleConfirmRestock}
        />

        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setActiveReceiptSale(null);
          }}
          sale={activeReceiptSale}
        />

        {/* Install / Download App Modal */}
        <InstallAppModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
          isInstalled={isAppInstalled}
          onInstallSuccess={() => {
            markAppAsInstalled();
            setIsAppInstalled(true);
            showToast("App installed successfully! Welcome to BAKEOLOGY.", "success");
          }}
        />

        {/* In-app Toast */}
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      </main>
    </div>
  );
}
