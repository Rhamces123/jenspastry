// ==========================================
// Jen's Pastry Shop - Custom React Hook
// Connects React components to the BakeryWorkflowManager Singleton
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import BakeryWorkflowManager from '../patterns/BakeryWorkflowManager.js';

export function useBakeryWorkflow() {
  const manager = BakeryWorkflowManager.getInstance();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = manager.subscribe(() => {
      setTick(prev => prev + 1);
    });
    return () => {
      unsubscribe();
    };
  }, [manager]);

  const ingredients = manager.getIngredients();
  const recipes = manager.getRecipes();
  const productionRequests = manager.getProductionRequests();
  const productionBatches = manager.getProductionBatches();
  const inventoryTransactions = manager.getInventoryTransactions();
  const notifications = manager.getNotifications();

  // Ingredient methods
  const addIngredient = useCallback((data, performedBy) => {
    return manager.addIngredient(data, performedBy);
  }, [manager]);

  const updateIngredient = useCallback((id, data) => {
    return manager.updateIngredient(id, data);
  }, [manager]);

  const addIngredientStock = useCallback((id, amount, reason, supplier, performedBy) => {
    return manager.addIngredientStock(id, amount, reason, supplier, performedBy);
  }, [manager]);

  const toggleIngredientDisabled = useCallback((id) => {
    return manager.toggleIngredientDisabled(id);
  }, [manager]);

  // Recipe methods
  const getRecipeForProduct = useCallback((product) => {
    return manager.getRecipeForProduct(product);
  }, [manager]);

  const saveRecipe = useCallback((recipeData) => {
    return manager.saveRecipe(recipeData);
  }, [manager]);

  const calculateRequiredIngredients = useCallback((recipe, productionQuantity) => {
    return manager.calculateRequiredIngredients(recipe, productionQuantity);
  }, [manager]);

  const checkIngredientsSufficiency = useCallback((recipe, productionQuantity) => {
    return manager.checkIngredientsSufficiency(recipe, productionQuantity);
  }, [manager]);

  // Production methods
  const createProductionRequest = useCallback((data) => {
    return manager.createProductionRequest(data);
  }, [manager]);

  const updateProductionRequestStatus = useCallback((requestId, status) => {
    return manager.updateProductionRequestStatus(requestId, status);
  }, [manager]);

  const startProduction = useCallback((requestId, bakerName) => {
    return manager.startProduction(requestId, bakerName);
  }, [manager]);

  const completeProduction = useCallback((data) => {
    return manager.completeProduction(data);
  }, [manager]);

  const receiveProductionBatch = useCallback((batchId, cashierName, shopManager) => {
    return manager.receiveProductionBatch(batchId, cashierName, shopManager);
  }, [manager]);

  const checkAndTriggerLowStock = useCallback((products) => {
    return manager.checkAndTriggerLowStock(products);
  }, [manager]);

  const recordCustomerSale = useCallback((sale, cashierName, allProducts) => {
    return manager.recordCustomerSale(sale, cashierName, allProducts);
  }, [manager]);

  // Notifications
  const addNotification = useCallback((data) => {
    return manager.addNotification(data);
  }, [manager]);

  const markNotificationAsRead = useCallback((id) => {
    return manager.markNotificationAsRead(id);
  }, [manager]);

  return {
    workflowManager: manager,
    ingredients,
    recipes,
    productionRequests,
    productionBatches,
    inventoryTransactions,
    notifications,
    addIngredient,
    updateIngredient,
    addIngredientStock,
    toggleIngredientDisabled,
    getRecipeForProduct,
    saveRecipe,
    calculateRequiredIngredients,
    checkIngredientsSufficiency,
    createProductionRequest,
    updateProductionRequestStatus,
    startProduction,
    completeProduction,
    receiveProductionBatch,
    checkAndTriggerLowStock,
    recordCustomerSale,
    addNotification,
    markNotificationAsRead
  };
}

export default useBakeryWorkflow;
