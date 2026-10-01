// ==========================================
// Jen's Pastry Shop - Custom React Hook
// Connects React components to the ShopManager Singleton
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import ShopManager from '../patterns/ShopManager.js';

// SINGLETON PATTERN
// Ensures that only one Shop Manager instance exists.
// All components consume this singleton instance.
export function useShop() {
  // Obtain the single ShopManager instance
  const manager = ShopManager.getInstance();

  // Local component state to trigger re-renders on manager changes
  const [, setTick] = useState(0);

  useEffect(() => {
    // Subscribe to changes in the Singleton instance
    const unsubscribe = manager.subscribe(() => {
      setTick(prev => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [manager]);

  // Read current state from the Singleton
  const products = manager.getProducts();
  const sales = manager.getSales();
  const summary = manager.getDashboardSummary();

  // FUNCTIONS: Action handlers delegated to the Singleton
  const addProduct = useCallback((data) => {
    return manager.addProduct(data);
  }, [manager]);

  const updateProduct = useCallback((id, data) => {
    return manager.updateProduct(id, data);
  }, [manager]);

  const deleteProduct = useCallback((id) => {
    return manager.deleteProduct(id);
  }, [manager]);

  const updateStock = useCallback((id, newStock) => {
    return manager.updateStock(id, newStock);
  }, [manager]);

  const completeSale = useCallback((options) => {
    return manager.completeSale(options);
  }, [manager]);

  const resetToDefaultData = useCallback(() => {
    return manager.resetToDefaultData();
  }, [manager]);

  return {
    shopManager: manager,
    products,
    sales,
    summary,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    completeSale,
    resetToDefaultData
  };
}
