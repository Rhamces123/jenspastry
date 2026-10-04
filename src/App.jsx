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

  // VARIABLES: Navigation & Modal UI states
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' | 'products' | 'inventory' | 'sales'
  const [cart, setCart] = useState([]);
  
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

  // FUNCTIONS: Complete Sale (Strategy Pattern)
  const handleCompleteSale = (saleOptions) => {
    try {
      // STRATEGY PATTERN: Executes discount calculation and updates Singleton inventory
      const recordedSale = completeSale(saleOptions);
      setActiveReceiptSale(recordedSale);
      setIsReceiptModalOpen(true);
      showToast(`Sale #${recordedSale.saleNumber} completed successfully!`, 'success');
    } catch (err) {
      showToast(err.message || 'Checkout failed', 'error');
    }
  };

  const handleViewReceipt = (sale) => {
    setActiveReceiptSale(sale);
    setIsReceiptModalOpen(true);
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className={`app-viewport-root ${deviceFrameMode ? 'mode-phone-frame' : 'mode-expanded'}`}>
      {/* Desktop Helper Bar: Allows toggling between Phone Frame & Full Width */}
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

      {/* Main Mobile App Container */}
      <main className="mobile-phone-container">
        {/* Device Notch & Status Bar (Simulated Phone Feel) */}
        <div className="mobile-status-bar">
          <span className="status-time">9:41</span>
          <div className="phone-camera-notch"></div>
          <div className="status-icons">
            <span className="text-2xs font-bold mr-1">5G</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Application Header */}
        <Header 
          onResetData={resetToDefaultData} 
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          isInstalled={isAppInstalled}
        />

        {/* Dynamic Main Body Content */}
        <div className="mobile-scrollable-body">
          {currentTab === 'dashboard' && (
            <Dashboard
              summary={summary}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenAddModal={() => {
                setEditingProduct(null);
                setIsFormModalOpen(true);
              }}
              onViewReceipt={handleViewReceipt}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
              isInstalled={isAppInstalled}
            />
          )}

          {currentTab === 'products' && (
            <Products
              products={products}
              onOpenAddModal={() => {
                setEditingProduct(null);
                setIsFormModalOpen(true);
              }}
              onEditProduct={(product) => {
                setEditingProduct(product);
                setIsFormModalOpen(true);
              }}
              onDeleteProduct={handleDeleteProduct}
              onQuickAddToCart={handleQuickAddToCart}
            />
          )}

          {currentTab === 'inventory' && (
            <Inventory
              products={products}
              onOpenRestockModal={(product) => {
                setRestockingProduct(product);
                setIsRestockModalOpen(true);
              }}
            />
          )}

          {currentTab === 'sales' && (
            <Sales
              products={products}
              sales={sales}
              cart={cart}
              setCart={setCart}
              onCompleteSale={handleCompleteSale}
              onViewReceipt={handleViewReceipt}
            />
          )}
        </div>

        {/* Fixed Mobile Bottom Navigation */}
        <BottomNavigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          cartCount={totalCartCount}
        />

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
