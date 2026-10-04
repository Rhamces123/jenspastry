// ==========================================
// BAKEOLOGY - Automated Test Suite
// Verifies Design Patterns & Business Logic
// ==========================================

import { PastryProductFactory } from '../src/patterns/PastryProductFactory.js';
import { 
  RegularDiscountStrategy, 
  StudentDiscountStrategy, 
  BulkOrderDiscountStrategy, 
  getDiscountStrategy 
} from '../src/patterns/DiscountStrategies.js';

// Polyfill localStorage for Node test environment if not present
if (typeof globalThis.localStorage === 'undefined') {
  const memoryStore = new Map();
  globalThis.localStorage = {
    getItem: (key) => memoryStore.get(key) || null,
    setItem: (key, val) => memoryStore.set(key, String(val)),
    removeItem: (key) => memoryStore.delete(key),
    clear: () => memoryStore.clear()
  };
}

// Import ShopManager after localStorage polyfill
import ShopManager from '../src/patterns/ShopManager.js';
import { 
  checkIsAppInstalled, 
  markAppAsInstalled, 
  clearAppInstalledState, 
  isStandaloneMode 
} from '../src/utils/pwa.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
}

console.log("==========================================");
console.log("RUNNING BAKEOLOGY TEST SUITE");
console.log("==========================================\n");

// ----------------------------------------------------
// 1. FACTORY PATTERN TESTS
// ----------------------------------------------------
console.log("1. Testing PastryProductFactory (Factory Pattern)...");

try {
  // Test Bread creation
  const bread = PastryProductFactory.createProduct({
    name: "Pandesal",
    category: "Bread",
    price: 3,
    stock: 100
  });
  assert(bread.name === "Pandesal", "Factory correctly sets product name");
  assert(bread.category === "Bread", "Factory correctly sets Bread category");
  assert(bread.price === 3, "Factory sets correct price");
  assert(bread.stock === 100, "Factory sets correct stock");
  assert(bread.icon === "🥖", "Factory assigns Bread icon");
  assert(bread.getStatus() === "In Stock", "Stock > 10 returns 'In Stock'");

  // Test Cake creation with low stock
  const cake = PastryProductFactory.createProduct({
    name: "Chocolate Cake",
    category: "Cake",
    price: 450,
    stock: 5
  });
  assert(cake.category === "Cake", "Factory correctly creates Cake product");
  assert(cake.icon === "🎂", "Factory assigns Cake icon");
  assert(cake.getStatus() === "Low Stock", "Stock between 1 and 10 returns 'Low Stock'");

  // Test Out of Stock status
  const outOfStockItem = PastryProductFactory.createProduct({
    name: "Croissant",
    category: "Pastry",
    price: 35,
    stock: 0
  });
  assert(outOfStockItem.getStatus() === "Out of Stock", "Stock = 0 returns 'Out of Stock'");

  // Test Validation in Factory
  let validationErrorCaught = false;
  try {
    PastryProductFactory.createProduct({ name: "", category: "Bread", price: 10, stock: 10 });
  } catch {
    validationErrorCaught = true;
  }
  assert(validationErrorCaught, "Factory throws error on empty product name");
} catch (e) {
  console.error("Factory Pattern Test error:", e);
}

// ----------------------------------------------------
// 2. STRATEGY PATTERN TESTS
// ----------------------------------------------------
console.log("\n2. Testing Discount Strategies (Strategy Pattern)...");

try {
  const regularStrategy = new RegularDiscountStrategy();
  const studentStrategy = new StudentDiscountStrategy();
  const bulkStrategy = new BulkOrderDiscountStrategy();

  const subtotal = 1000;

  // Regular: 0% discount
  const regDiscount = regularStrategy.calculateDiscount(subtotal);
  assert(regDiscount === 0, "RegularDiscountStrategy returns 0 discount");

  // Student: 5% discount (₱50 on ₱1000)
  const studDiscount = studentStrategy.calculateDiscount(subtotal);
  assert(studDiscount === 50, "StudentDiscountStrategy returns 5% discount (50 on 1000)");

  // Bulk: 10% discount (₱100 on ₱1000)
  const bulkDiscount = bulkStrategy.calculateDiscount(subtotal);
  assert(bulkDiscount === 100, "BulkOrderDiscountStrategy returns 10% discount (100 on 1000)");

  // Strategy retrieval helper
  const retrievedStudent = getDiscountStrategy('student');
  assert(retrievedStudent.id === 'student', "getDiscountStrategy correctly retrieves strategy by id");
} catch (e) {
  console.error("Strategy Pattern Test error:", e);
}

// ----------------------------------------------------
// 3. SINGLETON PATTERN & SHOPMANAGER TESTS
// ----------------------------------------------------
console.log("\n3. Testing ShopManager (Singleton Pattern)...");

try {
  const manager1 = ShopManager.getInstance();
  const manager2 = ShopManager.getInstance();

  assert(manager1 === manager2, "ShopManager.getInstance() returns the exact same singleton instance");

  // Check initial products loaded (starts clean with empty array for manual data entry)
  const products = manager1.getProducts();
  assert(Array.isArray(products), "ShopManager initialized with products array");
  assert(products.length > 0, "Initial products catalog is seeded with categorized pastries");

  // Add Product via ShopManager
  const newProduct = manager1.addProduct({
    name: "Ube Cheese Pandesal",
    category: "Bread",
    price: 15,
    stock: 60
  });
  assert(newProduct.name === "Ube Cheese Pandesal", "New product added via ShopManager");
  assert(manager1.getProductById(newProduct.id) !== undefined, "Newly added product is queryable by ID");

  // Update Product
  const updatedProduct = manager1.updateProduct(newProduct.id, {
    price: 18,
    stock: 55
  });
  assert(updatedProduct.price === 18, "Product price updated successfully");
  assert(updatedProduct.stock === 55, "Product stock updated successfully");

  // Update Stock directly (Restock)
  manager1.updateStock(newProduct.id, 80);
  assert(manager1.getProductById(newProduct.id).stock === 80, "Stock updated via updateStock to 80");

  // Test Sale & Stock Deduction (Strategy Pattern applied)
  const stockBeforeSale = manager1.getProductById(newProduct.id).stock;
  const sale = manager1.completeSale({
    cart: [
      { product: manager1.getProductById(newProduct.id), quantity: 10 }
    ],
    discountStrategyId: 'student'
  });

  assert(sale.subtotal === 180, "Subtotal calculated correctly: 10 * 18 = 180");
  assert(sale.discount === 9, "Student discount 5% on 180 is 9");
  assert(sale.total === 171, "Final total is 180 - 9 = 171");

  const stockAfterSale = manager1.getProductById(newProduct.id).stock;
  assert(stockAfterSale === stockBeforeSale - 10, "Stock properly decremented from inventory after sale");

  // Delete Product
  manager1.deleteProduct(newProduct.id);
  assert(manager1.getProductById(newProduct.id) === undefined, "Product deleted successfully");

  // Dashboard Summary Check
  const summary = manager1.getDashboardSummary();
  assert(typeof summary.totalProducts === 'number', "Dashboard reports totalProducts");
  assert(typeof summary.inventoryItems === 'number', "Dashboard reports inventoryItems");
  assert(typeof summary.todaySales === 'number', "Dashboard reports todaySales");
  assert(typeof summary.lowStockCount === 'number', "Dashboard reports lowStockCount");
  assert(Array.isArray(summary.recentSales), "Dashboard reports recentSales array");
} catch (e) {
  console.error("Singleton Pattern Test error:", e);
}

// ----------------------------------------------------
// 4. PWA INSTALLATION & STANDALONE STATE TESTS
// ----------------------------------------------------
console.log("\n4. Testing PWA Installation & Standalone Detection...");

try {
  clearAppInstalledState();
  assert(checkIsAppInstalled() === false, "checkIsAppInstalled returns false by default");

  markAppAsInstalled();
  assert(checkIsAppInstalled() === true, "checkIsAppInstalled returns true after markAppAsInstalled");

  clearAppInstalledState();
  assert(checkIsAppInstalled() === false, "checkIsAppInstalled returns false after clearAppInstalledState");

  // Simulate Standalone Display Mode (Installed PWA App running)
  globalThis.window = {
    matchMedia: (query) => ({
      matches: query.includes('display-mode: standalone')
    }),
    navigator: {}
  };

  assert(isStandaloneMode() === true, "isStandaloneMode returns true when display-mode: standalone matches");
  assert(checkIsAppInstalled() === true, "checkIsAppInstalled returns true in standalone mode even without localStorage");

  // Reset window
  delete globalThis.window;
} catch (e) {
  console.error("PWA Tests error:", e);
}

// ----------------------------------------------------
// 5. ROLE-BASED ACCESS CONTROL (RBAC) TESTS
// ----------------------------------------------------
console.log("\n5. Testing RBAC Roles, Dashboards, and Permissions...");

import { ROLES, ROLE_LABELS, ROLE_DASHBOARDS, getDashboardPathForRole, hasPermission, PERMISSIONS } from '../src/constants/roles.js';

try {
  // Test 4 Exact Roles
  assert(ROLES.CUSTOMER === 'customer', "ROLES.CUSTOMER is 'customer'");
  assert(ROLES.CASHIER === 'cashier', "ROLES.CASHIER is 'cashier'");
  assert(ROLES.BAKER === 'baker', "ROLES.BAKER is 'baker'");
  assert(ROLES.ADMIN === 'admin', "ROLES.ADMIN is 'admin'");
  assert(Object.keys(ROLES).length === 4, "Exactly 4 roles are defined");

  // Test Role Labels
  assert(ROLE_LABELS[ROLES.CUSTOMER] === 'Customer', "Customer role label is 'Customer'");
  assert(ROLE_LABELS[ROLES.CASHIER] === 'Cashier', "Cashier role label is 'Cashier'");
  assert(ROLE_LABELS[ROLES.BAKER] === 'Baker', "Baker role label is 'Baker'");
  assert(ROLE_LABELS[ROLES.ADMIN] === 'Store Owner / Admin', "Admin role label is 'Store Owner / Admin'");

  // Test Role Dashboard Paths
  assert(getDashboardPathForRole('customer') === '/customer/dashboard', "Customer routes to /customer/dashboard");
  assert(getDashboardPathForRole('cashier') === '/cashier/dashboard', "Cashier routes to /cashier/dashboard");
  assert(getDashboardPathForRole('baker') === '/baker/dashboard', "Baker routes to /baker/dashboard");
  assert(getDashboardPathForRole('admin') === '/admin/dashboard', "Admin routes to /admin/dashboard");
  assert(getDashboardPathForRole('unknown_role') === '/customer/dashboard', "Unknown role safely defaults to /customer/dashboard");

  // Test Permissions Matrix
  assert(hasPermission(ROLES.CUSTOMER, PERMISSIONS.BROWSE_PRODUCTS) === true, "Customer can browse products");
  assert(hasPermission(ROLES.CUSTOMER, PERMISSIONS.PLACE_ORDER) === true, "Customer can place order");
  assert(hasPermission(ROLES.CUSTOMER, PERMISSIONS.POS) === false, "Customer cannot access POS");
  assert(hasPermission(ROLES.CUSTOMER, PERMISSIONS.PRODUCTION_QUEUE) === false, "Customer cannot access production queue");
  assert(hasPermission(ROLES.CUSTOMER, PERMISSIONS.PRODUCT_MANAGEMENT) === false, "Customer cannot access product management");

  assert(hasPermission(ROLES.CASHIER, PERMISSIONS.POS) === true, "Cashier has POS permission");
  assert(hasPermission(ROLES.CASHIER, PERMISSIONS.PROCESS_PAYMENTS) === true, "Cashier can process payments");
  assert(hasPermission(ROLES.CASHIER, PERMISSIONS.PRODUCTION_QUEUE) === false, "Cashier cannot modify kitchen production queue");
  assert(hasPermission(ROLES.CASHIER, PERMISSIONS.PRODUCT_MANAGEMENT) === false, "Cashier cannot create/delete catalog products");

  assert(hasPermission(ROLES.BAKER, PERMISSIONS.PRODUCTION_QUEUE) === true, "Baker has production queue permission");
  assert(hasPermission(ROLES.BAKER, PERMISSIONS.INVENTORY_VIEW) === true, "Baker can view inventory");
  assert(hasPermission(ROLES.BAKER, PERMISSIONS.POS) === false, "Baker cannot access POS");
  assert(hasPermission(ROLES.BAKER, PERMISSIONS.USER_MANAGEMENT) === false, "Baker cannot manage users");

  assert(hasPermission(ROLES.ADMIN, PERMISSIONS.PRODUCT_MANAGEMENT) === true, "Admin has product management permission");
  assert(hasPermission(ROLES.ADMIN, PERMISSIONS.USER_MANAGEMENT) === true, "Admin has user management permission");
  assert(hasPermission(ROLES.ADMIN, PERMISSIONS.SALES_REPORTS_FULL) === true, "Admin has full sales reports permission");
  assert(hasPermission(ROLES.ADMIN, PERMISSIONS.SYSTEM_SETTINGS) === true, "Admin has system settings permission");
} catch (e) {
  console.error("RBAC Tests error:", e);
}

console.log("\n==========================================");
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log("==========================================");

