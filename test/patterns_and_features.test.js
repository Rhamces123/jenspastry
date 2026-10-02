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

  // Check initial products loaded
  const products = manager1.getProducts();
  assert(products.length >= 8, `ShopManager initialized with ${products.length} sample products`);

  const initialPandesal = manager1.getProducts().find(p => p.name === "Pandesal");
  assert(initialPandesal !== undefined, "Sample product 'Pandesal' exists");

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

console.log("\n==========================================");
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log("==========================================");
