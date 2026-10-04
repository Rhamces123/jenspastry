// ==========================================
// Jen's Pastry Shop - Singleton Pattern
// Central Management System for Shop State
// ==========================================

import { PastryProductFactory } from './PastryProductFactory.js';
import { getDiscountStrategy } from './DiscountStrategies.js';
import {
  saveProducts,
  loadProducts,
  saveSales,
  loadSales,
  clearAllStorage
} from '../utils/storage.js';

// VARIABLES
// Initial clean state: empty catalog and sales ready for manual data entry
const INITIAL_PRODUCTS = [];
const INITIAL_SALES = [];

// SINGLETON PATTERN
// Ensures that only one Shop Manager instance exists.
// All components across the React app share this single source of truth.
class ShopManager {
  // Static variable to store the single instance
  static #instance = null;

  constructor() {
    // Prevent direct instantiation with `new ShopManager()`
    if (ShopManager.#instance) {
      throw new Error("Cannot create multiple ShopManager instances. Use ShopManager.getInstance().");
    }

    // ARRAYS: internal state stores
    this.products = [];
    this.sales = [];
    this.subscribers = [];

    // Initialize state from LocalStorage or seed data
    this.initializeData();
  }

  /**
   * Static method to access the single instance of ShopManager.
   * @returns {ShopManager}
   */
  static getInstance() {
    if (!ShopManager.#instance) {
      ShopManager.#instance = new ShopManager();
    }
    return ShopManager.#instance;
  }

  // FUNCTIONS: Observer pattern helpers to notify React hooks
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (err) {
        console.error("Error in ShopManager subscriber:", err);
      }
    });
  }

  /**
   * Loads products and sales from LocalStorage.
   * If LocalStorage has not been purged of old sample data, purges it first.
   * Defaults to empty arrays so products/sales can be added manually.
   */
  initializeData() {
    // One-time purge check: if the user's browser still has old mock/sample data, purge it cleanly
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const PURGE_KEY = 'jens_pastry_sample_data_purged_v2';
        if (localStorage.getItem(PURGE_KEY) !== 'true') {
          localStorage.removeItem('bakeology_products_v1');
          localStorage.removeItem('bakeology_sales_v1');
          localStorage.removeItem('bakeology_sales');
          localStorage.removeItem('jens_pastry_products_v1');
          localStorage.removeItem('jens_pastry_sales_v1');
          localStorage.setItem(PURGE_KEY, 'true');
        }
      }
    } catch (e) {
      console.warn("Storage purge check skipped:", e);
    }

    const storedProducts = loadProducts();
    const storedSales = loadSales();

    if (storedProducts && Array.isArray(storedProducts) && storedProducts.length > 0) {
      // FACTORY PATTERN: Reconstruct product objects through the Factory
      this.products = storedProducts.map(item => PastryProductFactory.createProduct(item));
    } else {
      this.products = [];
      saveProducts(this.products);
    }

    if (storedSales && Array.isArray(storedSales) && storedSales.length > 0) {
      this.sales = storedSales;
    } else {
      this.sales = [];
      saveSales(this.sales);
    }
  }

  // ==========================================
  // PRODUCT MANAGEMENT
  // ==========================================

  // FUNCTIONS: Get all products
  getProducts() {
    return [...this.products];
  }

  // FUNCTIONS: Get product by id
  getProductById(id) {
    return this.products.find(p => p.id === Number(id));
  }

  /**
   * Adds a new product using the Factory Pattern.
   * @param {Object} rawData - { name, category, price, stock }
   * @returns {Object} Newly created product
   */
  addProduct(rawData) {
    // FACTORY PATTERN
    // Creates pastry product objects in one centralized place.
    const newProduct = PastryProductFactory.createProduct({
      id: Date.now(),
      name: rawData.name,
      category: rawData.category,
      price: rawData.price,
      stock: rawData.stock
    });

    // ARRAYS: Push to product list
    this.products = [newProduct, ...this.products];
    saveProducts(this.products);
    this.notify();
    return newProduct;
  }

  /**
   * Updates an existing product.
   * @param {number} id
   * @param {Object} updatedFields
   */
  updateProduct(id, updatedFields) {
    const targetId = Number(id);
    const index = this.products.findIndex(p => p.id === targetId);

    if (index === -1) {
      throw new Error(`Product with ID ${id} not found.`);
    }

    const current = this.products[index];

    // FACTORY PATTERN: Re-create to validate schema and type
    const updated = PastryProductFactory.createProduct({
      id: current.id,
      name: updatedFields.name !== undefined ? updatedFields.name : current.name,
      category: updatedFields.category !== undefined ? updatedFields.category : current.category,
      price: updatedFields.price !== undefined ? updatedFields.price : current.price,
      stock: updatedFields.stock !== undefined ? updatedFields.stock : current.stock
    });

    this.products[index] = updated;
    saveProducts(this.products);
    this.notify();
    return updated;
  }

  /**
   * Deletes a product by ID.
   * @param {number} id
   */
  deleteProduct(id) {
    const targetId = Number(id);
    this.products = this.products.filter(p => p.id !== targetId);
    saveProducts(this.products);
    this.notify();
    return true;
  }

  /**
   * Adjusts stock quantity for inventory management.
   * @param {number} id
   * @param {number} newStock
   */
  updateStock(id, newStock) {
    const targetId = Number(id);
    const product = this.products.find(p => p.id === targetId);
    if (!product) throw new Error("Product not found");

    const parsedStock = Math.max(0, Number(newStock) || 0);
    product.stock = parsedStock;

    saveProducts(this.products);
    this.notify();
    return product;
  }

  // ==========================================
  // SALES & CHECKOUT
  // ==========================================

  // FUNCTIONS: Get sales history
  getSales() {
    return [...this.sales];
  }

  /**
   * Completes a sale transaction using Strategy Pattern for discount calculation.
   * Reduces inventory and records the transaction.
   * 
   * @param {Object} options
   * @param {Array} options.cart - [{ product, quantity }]
   * @param {string} options.discountStrategyId - 'regular' | 'student' | 'bulk'
   * @returns {Object} completed sale record
   */
  completeSale({ cart, discountStrategyId }) {
    if (!cart || cart.length === 0) {
      throw new Error("Cart is empty. Cannot complete sale.");
    }

    // 1. Verify stock availability for all items
    for (const item of cart) {
      const liveProduct = this.getProductById(item.product.id);
      if (!liveProduct) {
        throw new Error(`Product "${item.product.name}" no longer exists.`);
      }
      if (liveProduct.stock < item.quantity) {
        throw new Error(`Not enough stock for "${liveProduct.name}". Available: ${liveProduct.stock}, requested: ${item.quantity}.`);
      }
    }

    // 2. Calculate Subtotal
    let subtotal = 0;
    const saleItems = cart.map(item => {
      const lineTotal = item.product.price * item.quantity;
      subtotal += lineTotal;
      return {
        id: item.product.id,
        name: item.product.name,
        category: item.product.category,
        price: item.product.price,
        quantity: item.quantity,
        lineTotal: lineTotal
      };
    });

    // 3. STRATEGY PATTERN: Apply selected discount strategy
    // Allows different discount methods to be selected during checkout.
    const strategy = getDiscountStrategy(discountStrategyId);
    const discountAmount = strategy.calculateDiscount(subtotal);
    const finalTotal = Math.max(0, subtotal - discountAmount);

    // 4. Reduce Inventory
    for (const item of cart) {
      const liveProduct = this.getProductById(item.product.id);
      liveProduct.stock -= item.quantity;
    }
    saveProducts(this.products);

    // 5. OBJECTS: Create new sale record
    const nextSaleNumber = this.sales.length > 0 
      ? Math.max(...this.sales.map(s => Number(s.saleNumber) || 0)) + 1 
      : 1;

    const newSale = {
      id: `SALE-${String(nextSaleNumber).padStart(3, '0')}`,
      saleNumber: nextSaleNumber,
      date: new Date().toISOString(),
      customerType: strategy.customerLabel,
      discountStrategyId: strategy.id,
      discountRate: strategy.rate,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      total: Math.round(finalTotal * 100) / 100,
      items: saleItems
    };

    // ARRAYS: Save sale to history
    this.sales = [newSale, ...this.sales];
    saveSales(this.sales);

    // Notify React components of state change
    this.notify();

    return newSale;
  }

  // ==========================================
  // DASHBOARD SUMMARY
  // ==========================================

  /**
   * Computes real-time dashboard analytics.
   * @returns {Object} dashboard summary
   */
  getDashboardSummary() {
    const totalProducts = this.products.length;
    
    // Sum total stock quantity across all products
    const inventoryItems = this.products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);

    // Filter today's sales
    const today = new Date().toDateString();
    const todaySales = this.sales
      .filter(s => new Date(s.date).toDateString() === today)
      .reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    // Count low stock items (1 to 10) and out of stock (0)
    const lowStockItems = this.products.filter(p => p.stock > 0 && p.stock <= 10);
    const outOfStockItems = this.products.filter(p => p.stock === 0);

    return {
      totalProducts,
      inventoryItems,
      todaySales,
      lowStockCount: lowStockItems.length + outOfStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockProducts: [...outOfStockItems, ...lowStockItems],
      recentSales: this.sales.slice(0, 5)
    };
  }

  /**
   * Resets and clears all product items and sales history to a fresh clean slate.
   */
  resetToDefaultData() {
    clearAllStorage();
    this.products = [];
    this.sales = [];
    saveProducts(this.products);
    saveSales(this.sales);
    this.notify();
  }
}

// Export the singleton getter
export default ShopManager;
