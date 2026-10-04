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
// Default catalog seeded on first launch (customers see a categorized menu out of the box)
const INITIAL_PRODUCTS = [
  { name: 'Pandesal', category: 'Bread', price: 15, stock: 50, icon: '🍞', imageUrl: '/products/bread.svg' },
  { name: 'Ensaymada', category: 'Bread', price: 45, stock: 30, icon: '🥖', imageUrl: '/products/bread.svg' },
  { name: 'Monay', category: 'Bread', price: 20, stock: 40, icon: '🍞', imageUrl: '/products/bread.svg' },
  { name: 'Siopao', category: 'Bread', price: 35, stock: 25, icon: '🥟', imageUrl: '/products/bread.svg' },
  { name: 'Pan de Coco', category: 'Bread', price: 25, stock: 30, icon: '🥥', imageUrl: '/products/bread.svg' },
  { name: 'Loaf Bread', category: 'Bread', price: 70, stock: 20, icon: '🍞', imageUrl: '/products/bread.svg' },
  { name: 'Dinner Rolls', category: 'Bread', price: 12, stock: 60, icon: '🥖', imageUrl: '/products/bread.svg' },
  { name: 'Ube Pandesal', category: 'Bread', price: 20, stock: 40, icon: '🍞', imageUrl: '/products/bread.svg' },

  { name: 'Croissant', category: 'Pastry', price: 55, stock: 30, icon: '🥐', imageUrl: '/products/pastry.svg' },
  { name: 'Danish', category: 'Pastry', price: 50, stock: 25, icon: '🥐', imageUrl: '/products/pastry.svg' },
  { name: 'Pain au Chocolat', category: 'Pastry', price: 60, stock: 20, icon: '🍫', imageUrl: '/products/pastry.svg' },
  { name: 'Cinnamon Roll', category: 'Pastry', price: 48, stock: 25, icon: '🥮', imageUrl: '/products/pastry.svg' },
  { name: 'Apple Pie', category: 'Pastry', price: 85, stock: 15, icon: '🥧', imageUrl: '/products/pastry.svg' },
  { name: 'Empanada', category: 'Pastry', price: 40, stock: 30, icon: '🥟', imageUrl: '/products/pastry.svg' },
  { name: 'Hopia', category: 'Pastry', price: 30, stock: 35, icon: '🥮', imageUrl: '/products/pastry.svg' },
  { name: 'Pie', category: 'Pastry', price: 75, stock: 18, icon: '🥧', imageUrl: '/products/pastry.svg' },

  { name: 'Chocolate Cake', category: 'Cake', price: 650, stock: 10, icon: '🍫', imageUrl: '/products/cake.svg' },
  { name: 'Vanilla Sponge Cake', category: 'Cake', price: 550, stock: 10, icon: '🎂', imageUrl: '/products/cake.svg' },
  { name: 'Red Velvet Cake', category: 'Cake', price: 700, stock: 8, icon: '🎂', imageUrl: '/products/cake.svg' },
  { name: 'Carrot Cake', category: 'Cake', price: 600, stock: 10, icon: '🥕', imageUrl: '/products/cake.svg' },
  { name: 'Ube Cake', category: 'Cake', price: 750, stock: 8, icon: '🍠', imageUrl: '/products/cake.svg' },
  { name: 'Cheesecake', category: 'Cake', price: 680, stock: 10, icon: '🍰', imageUrl: '/products/cake.svg' },

  { name: 'Brewed Coffee', category: 'Beverage', price: 60, stock: 40, icon: '☕', imageUrl: '/products/beverage.svg' },
  { name: 'Iced Cafe Latte', category: 'Beverage', price: 85, stock: 35, icon: '🧋', imageUrl: '/products/beverage.svg' },
  { name: 'Hot Chocolate', category: 'Beverage', price: 75, stock: 25, icon: '🍫', imageUrl: '/products/beverage.svg' },
  { name: 'Matcha Green Tea', category: 'Beverage', price: 90, stock: 20, icon: '🍵', imageUrl: '/products/beverage.svg' },

  { name: 'Brownie', category: 'Dessert', price: 45, stock: 30, icon: '🍫', imageUrl: '/products/dessert.svg' },
  { name: 'Macarons', category: 'Dessert', price: 120, stock: 20, icon: '🍪', imageUrl: '/products/dessert.svg' },
  { name: 'Pudding', category: 'Dessert', price: 40, stock: 25, icon: '🍮', imageUrl: '/products/dessert.svg' },
  { name: 'Crème Brûlée', category: 'Dessert', price: 70, stock: 15, icon: '🍮', imageUrl: '/products/dessert.svg' },
  { name: 'Fruit Tart', category: 'Dessert', price: 65, stock: 15, icon: '🍓', imageUrl: '/products/dessert.svg' },
  { name: 'Cupcake', category: 'Dessert', price: 35, stock: 40, icon: '🧁', imageUrl: '/products/dessert.svg' },
  { name: 'Doughnut', category: 'Dessert', price: 30, stock: 40, icon: '🍩', imageUrl: '/products/dessert.svg' },
  { name: 'Tart', category: 'Dessert', price: 55, stock: 20, icon: '🥧', imageUrl: '/products/dessert.svg' }
];
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
      let prods = storedProducts.map(item => PastryProductFactory.createProduct(item));
      const hasBeverage = prods.some(p => p.category?.toLowerCase() === 'beverage');
      if (!hasBeverage) {
        const beverageSeeds = INITIAL_PRODUCTS
          .filter(p => p.category === 'Beverage')
          .map((item, i) => PastryProductFactory.createProduct({ id: `seed-bev-${i + 1}`, ...item }));
        prods = [...prods, ...beverageSeeds];
        saveProducts(prods);
      }
      this.products = prods;
    } else {
      this.products = INITIAL_PRODUCTS.map((item, i) =>
        PastryProductFactory.createProduct({ id: `seed-${i + 1}`, ...item })
      );
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
    const defaultImage = rawData.imageUrl || (rawData.category ? `/products/${rawData.category.toLowerCase()}.svg` : '');
    const newProduct = PastryProductFactory.createProduct({
      id: Date.now(),
      name: rawData.name,
      category: rawData.category,
      price: rawData.price,
      stock: rawData.stock,
      imageUrl: defaultImage
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
      stock: updatedFields.stock !== undefined ? updatedFields.stock : current.stock,
      imageUrl: updatedFields.imageUrl !== undefined ? updatedFields.imageUrl : current.imageUrl,
      icon: updatedFields.icon !== undefined ? updatedFields.icon : current.icon
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
   * Supports both completeSale({ cart, discountStrategyId, customerLabel }) 
   * and completeSale(cartArray, customerLabel, discountStrategyId).
   * 
   * @param {Object|Array} arg1 - options object { cart, discountStrategyId, customerLabel } OR cart array
   * @param {string} [arg2] - customerLabel if arg1 is array, or fallback
   * @param {string} [arg3] - discountStrategyId if arg1 is array
   * @returns {Object} completed sale record
   */
  completeSale(arg1, arg2, arg3) {
    let rawCart = [];
    let discountStrategyId = 'regular';
    let customCustomerLabel = null;

    if (Array.isArray(arg1)) {
      rawCart = arg1;
      customCustomerLabel = typeof arg2 === 'string' ? arg2 : null;
      discountStrategyId = arg3 || (typeof arg2 === 'string' && !arg3 ? 'regular' : arg2) || 'regular';
    } else if (arg1 && typeof arg1 === 'object') {
      rawCart = arg1.cart || [];
      discountStrategyId = arg1.discountStrategyId || 'regular';
      customCustomerLabel = arg1.customerLabel || arg1.customerName || (typeof arg2 === 'string' ? arg2 : null);
    }

    if (!rawCart || rawCart.length === 0) {
      throw new Error("Cart is empty. Cannot complete sale.");
    }

    // Normalize each item in cart whether it's { product, quantity } or flat { id, name, price, quantity, ... }
    const cart = rawCart.map(item => {
      if (item.product) {
        return {
          product: item.product,
          quantity: Number(item.quantity) || 1
        };
      }
      return {
        product: item,
        quantity: Number(item.quantity) || 1
      };
    });

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
      customerType: customCustomerLabel || strategy.customerLabel,
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
