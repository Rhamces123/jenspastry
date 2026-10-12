// ==========================================
// Jen's Pastry Shop - Singleton Pattern
// Central Management System for Shop State
// ==========================================

import { PastryProductFactory } from './PastryProductFactory.js';
import { getDiscountStrategy } from './DiscountStrategies.js';
import BakeryWorkflowManager from './BakeryWorkflowManager.js';
import {
  saveProducts,
  loadProducts,
  saveSales,
  loadSales,
  clearAllStorage
} from '../utils/storage.js';

// VARIABLES
// Default catalog seeded on first launch with the official Bakeology 20-item menu
export const INITIAL_PRODUCTS = [
  // Cakes
  { 
    name: 'Chocolate Cake Slice', 
    category: 'Cakes', 
    price: 85.00, 
    stock: 20, 
    icon: '🍫', 
    imageUrl: '/products/chocolate-cake-slice.jpg',
    description: 'Rich, moist chocolate sponge layered with decadent fudge frosting.'
  },
  { 
    name: 'Red Velvet Cake Slice', 
    category: 'Cakes', 
    price: 95.00, 
    stock: 15, 
    icon: '🎂', 
    imageUrl: '/products/red-velvet-cake-slice.jpg',
    description: 'Velvety crimson cake filled with smooth cream cheese icing.'
  },
  { 
    name: 'Blueberry Cheesecake', 
    category: 'Cakes', 
    price: 110.00, 
    stock: 12, 
    icon: '🍰', 
    imageUrl: '/products/blueberry-cheesecake.jpg',
    description: 'Creamy New York style cheesecake topped with whole wild blueberries.'
  },

  // Cupcakes
  { 
    name: 'Chocolate Cupcake', 
    category: 'Cupcakes', 
    price: 45.00, 
    stock: 30, 
    icon: '🧁', 
    imageUrl: '/products/chocolate-cupcake.jpg',
    description: 'Fluffy chocolate cupcake with rich chocolate buttercream swirl.'
  },
  { 
    name: 'Vanilla Cupcake', 
    category: 'Cupcakes', 
    price: 40.00, 
    stock: 25, 
    icon: '🧁', 
    imageUrl: '/products/vanilla-cupcake.jpg',
    description: 'Classic Madagascar vanilla cupcake with pastel buttercream swirl.'
  },

  // Muffins
  { 
    name: 'Blueberry Muffin', 
    category: 'Muffins', 
    price: 50.00, 
    stock: 18, 
    icon: '🧁', 
    imageUrl: '/products/blueberry-muffin.jpg',
    description: 'Freshly baked bakery muffin packed with plump berries and sugar crust.'
  },

  // Cookies
  { 
    name: 'Chocolate Chip Cookie', 
    category: 'Cookies', 
    price: 30.00, 
    stock: 40, 
    icon: '🍪', 
    imageUrl: '/products/chocolate-chip-cookie.jpg',
    description: 'Our signature Bakeology cookie loaded with gooey chocolate chips.'
  },
  { 
    name: 'Oatmeal Raisin Cookie', 
    category: 'Cookies', 
    price: 35.00, 
    stock: 25, 
    icon: '🍪', 
    imageUrl: '/products/oatmeal-raisin-cookie.jpg',
    description: 'Chewy whole oats, warm cinnamon, and sweet plump raisins.'
  },

  // Pastries
  { 
    name: 'Butter Croissant', 
    category: 'Pastries', 
    price: 55.00, 
    stock: 20, 
    icon: '🥐', 
    imageUrl: '/products/butter-croissant.jpg',
    description: 'Golden flaky French pastry folded with 100% pure butter layers.'
  },
  { 
    name: 'Chocolate Croissant', 
    category: 'Pastries', 
    price: 65.00, 
    stock: 15, 
    icon: '🥐', 
    imageUrl: '/products/chocolate-croissant.jpg',
    description: 'Crisp laminated pastry stuffed with dual batons of dark chocolate.'
  },
  { 
    name: 'Cheese Danish', 
    category: 'Pastries', 
    price: 60.00, 
    stock: 12, 
    icon: '🥐', 
    imageUrl: '/products/cheese-danish.jpg',
    description: 'Tender puff pastry filled with sweetened cream cheese and glaze.'
  },
  { 
    name: 'Cinnamon Roll', 
    category: 'Pastries', 
    price: 50.00, 
    stock: 18, 
    icon: '🥮', 
    imageUrl: '/products/cinnamon-roll.jpg',
    description: 'Soft swirl of Ceylon cinnamon brown sugar with vanilla glaze.'
  },

  // Tarts
  { 
    name: 'Egg Tart', 
    category: 'Tarts', 
    price: 35.00, 
    stock: 24, 
    icon: '🥧', 
    imageUrl: '/products/egg-tart.jpg',
    description: 'Silky smooth egg custard nestled in a flaky buttery pastry cup.'
  },
  { 
    name: 'Blueberry Tart', 
    category: 'Tarts', 
    price: 75.00, 
    stock: 10, 
    icon: '🥧', 
    imageUrl: '/products/blueberry-tart.jpg',
    description: 'Crisp shortbread tart filled with vanilla pastry cream and fresh blueberries.'
  },

  // Pies
  { 
    name: 'Apple Pie Slice', 
    category: 'Pies', 
    price: 70.00, 
    stock: 12, 
    icon: '🥧', 
    imageUrl: '/products/apple-pie-slice.jpg',
    description: 'Tender spiced Granny Smith apples encased in a golden lattice crust.'
  },

  // Breads
  { 
    name: 'Banana Bread Slice', 
    category: 'Breads', 
    price: 40.00, 
    stock: 20, 
    icon: '🍞', 
    imageUrl: '/products/banana-bread.jpg',
    description: 'Homestyle moist banana loaf baked with ripe bananas and chocolate chips.'
  },

  // Filipino Pastries
  { 
    name: 'Ensaymada', 
    category: 'Filipino Pastries', 
    price: 35.00, 
    stock: 30, 
    icon: '🥖', 
    imageUrl: '/products/ensaymada.jpg',
    description: 'Traditional spiral brioche brushed with butter, sugar, and grated cheese.'
  },
  { 
    name: 'Spanish Bread', 
    category: 'Filipino Pastries', 
    price: 15.00, 
    stock: 40, 
    icon: '🥖', 
    imageUrl: '/products/spanish-bread.jpg',
    description: 'Golden breadcrumbs-dusted rolls filled with sweet buttery paste.'
  },
  { 
    name: 'Cheese Bread Roll', 
    category: 'Filipino Pastries', 
    price: 20.00, 
    stock: 35, 
    icon: '🥖', 
    imageUrl: '/products/cheese-bread-roll.jpg',
    description: 'Soft Filipino bakery roll loaded with sweet cheddar cheese filling.'
  },

  // Brownies
  { 
    name: 'Brownie', 
    category: 'Brownies', 
    price: 45.00, 
    stock: 20, 
    icon: '🍫', 
    imageUrl: '/products/brownie.jpg',
    description: 'Fudgy, dense Belgian chocolate square with crackly top and chocolate swirl.'
  }
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
        const PURGE_KEY = 'bakeology_menu_photos_v6';
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
      const seenIds = new Set();
      this.products = storedProducts.map((item, idx) => {
        let safeId = item.id;
        const fallbackSlug = `prod-${String(item.name || `item-${idx + 1}`).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        if (!safeId || safeId === 'undefined' || safeId === 'null' || seenIds.has(String(safeId))) {
          safeId = fallbackSlug;
        }
        seenIds.add(String(safeId));

        return PastryProductFactory.createProduct({
          minimumStock: item.minimumStock !== undefined ? item.minimumStock : 20,
          productionBatchSize: item.productionBatchSize !== undefined ? item.productionBatchSize : 30,
          ...item,
          id: safeId
        });
      });
    } else {
      this.products = INITIAL_PRODUCTS.map((item, i) =>
        PastryProductFactory.createProduct({ id: `seed-${i + 1}`, ...item })
      );
      saveProducts(this.products);
    }

    // Trigger low stock check on initialized products
    try {
      BakeryWorkflowManager.getInstance().checkAndTriggerLowStock(this.products);
    } catch (e) {
      console.warn("Could not check low stock on initialize:", e);
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
    if (id === undefined || id === null) return undefined;
    return this.products.find(p => String(p.id) === String(id) || p.id === id || (typeof id === 'number' && p.id === id));
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
      minimumStock: rawData.minimumStock !== undefined ? rawData.minimumStock : 20,
      productionBatchSize: rawData.productionBatchSize !== undefined ? rawData.productionBatchSize : 30,
      imageUrl: defaultImage
    });

    // ARRAYS: Push to product list
    this.products = [newProduct, ...this.products];
    saveProducts(this.products);
    BakeryWorkflowManager.getInstance().checkAndTriggerLowStock(this.products);
    this.notify();
    return newProduct;
  }

  /**
   * Updates an existing product.
   * @param {string|number} id
   * @param {Object} updatedFields
   */
  updateProduct(id, updatedFields) {
    const index = this.products.findIndex(p => String(p.id) === String(id) || p.id === id);

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
      minimumStock: updatedFields.minimumStock !== undefined ? updatedFields.minimumStock : (current.minimumStock || 20),
      productionBatchSize: updatedFields.productionBatchSize !== undefined ? updatedFields.productionBatchSize : (current.productionBatchSize || 30),
      imageUrl: updatedFields.imageUrl !== undefined ? updatedFields.imageUrl : current.imageUrl,
      icon: updatedFields.icon !== undefined ? updatedFields.icon : current.icon
    });

    this.products[index] = updated;
    saveProducts(this.products);
    BakeryWorkflowManager.getInstance().checkAndTriggerLowStock(this.products);
    this.notify();
    return updated;
  }

  /**
   * Deletes a product by ID.
   * @param {string|number} id
   */
  deleteProduct(id) {
    this.products = this.products.filter(p => String(p.id) !== String(id) && p.id !== id);
    saveProducts(this.products);
    this.notify();
    return true;
  }

  /**
   * Adjusts stock quantity for inventory management.
   * @param {string|number} id
   * @param {number} newStock
   */
  updateStock(id, newStock) {
    const product = this.products.find(p => String(p.id) === String(id) || p.id === id);
    if (!product) throw new Error(`Product "${id}" not found.`);

    const parsedStock = Math.max(0, Number(newStock) || 0);
    product.stock = parsedStock;

    saveProducts(this.products);
    BakeryWorkflowManager.getInstance().checkAndTriggerLowStock(this.products);
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

    // Audit finished product inventory deduction & trigger low-stock production requests
    try {
      BakeryWorkflowManager.getInstance().recordCustomerSale(
        newSale,
        customCustomerLabel || 'Cashier Staff',
        this.products
      );
    } catch (e) {
      console.warn("Could not log sale inventory transaction:", e);
    }

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
    this.products = INITIAL_PRODUCTS.map((item, i) =>
      PastryProductFactory.createProduct({ id: `seed-${i + 1}`, ...item })
    );
    this.sales = [];
    saveProducts(this.products);
    saveSales(this.sales);
    this.notify();
  }
}

// Export the singleton getter
export default ShopManager;
