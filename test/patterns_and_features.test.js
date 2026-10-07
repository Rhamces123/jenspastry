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

// Import ShopManager and BakeryWorkflowManager after localStorage polyfill
import ShopManager from '../src/patterns/ShopManager.js';
import BakeryWorkflowManager from '../src/patterns/BakeryWorkflowManager.js';
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

  // Test Beverage creation
  const beverage = PastryProductFactory.createProduct({
    name: "Brewed Coffee",
    category: "Beverage",
    price: 60,
    stock: 20
  });
  assert(beverage.category === "Beverage", "Factory correctly creates Beverage product");
  assert(beverage.icon === "☕", "Factory assigns Beverage icon");

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

  // Test Restock on Seeded Products with string IDs (e.g. 'seed-7' Dinner Rolls)
  const dinnerRolls = manager1.getProducts().find(p => p.name === 'Dinner Rolls');
  if (dinnerRolls) {
    const updatedDinnerRolls = manager1.updateStock(dinnerRolls.id, 70);
    assert(updatedDinnerRolls.stock === 70, "Seeded product Dinner Rolls stock successfully updated to 70");
    assert(manager1.getProductById(dinnerRolls.id).stock === 70, "getProductById retrieves seeded product with updated stock");
  }

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

  // Test Sale with Flat Cart Array & Customer Name (POS Cashier format)
  const posFlatSale = manager1.completeSale(
    [{ id: newProduct.id, name: newProduct.name, price: 18, quantity: 5 }],
    'Walk-in Guest',
    'bulk'
  );
  assert(posFlatSale.subtotal === 90, "Flat array subtotal correctly calculated: 5 * 18 = 90");
  assert(posFlatSale.discount === 9, "Bulk discount 10% on 90 is 9");
  assert(posFlatSale.total === 81, "Flat array final total: 90 - 9 = 81");
  assert(posFlatSale.customerType === 'Walk-in Guest', "Customer label retained on sale record");

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

import { ROLES, ROLE_LABELS, ROLE_DASHBOARDS, getDashboardPathForRole, hasPermission, PERMISSIONS, resolveRoleForUser } from '../src/constants/roles.js';

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

  // Test resolveRoleForUser Helper
  assert(resolveRoleForUser('admin@jenspastry.com') === ROLES.ADMIN, "resolveRoleForUser identifies admin@jenspastry.com as ADMIN");
  assert(resolveRoleForUser('cashier@jenspastry.com') === ROLES.CASHIER, "resolveRoleForUser identifies cashier@jenspastry.com as CASHIER");
  assert(resolveRoleForUser('baker@jenspastry.com') === ROLES.BAKER, "resolveRoleForUser identifies baker@jenspastry.com as BAKER");
  assert(resolveRoleForUser('admin@custom.com', 'admin') === ROLES.ADMIN, "resolveRoleForUser identifies admin prefix/name as ADMIN");
  assert(resolveRoleForUser('owner@store.com', 'Store Owner / Admin') === ROLES.ADMIN, "resolveRoleForUser identifies Store Owner title as ADMIN");
  assert(resolveRoleForUser('admin@jenspastry.com', 'admin', 'customer') === ROLES.ADMIN, "resolveRoleForUser overrides stale customer role for official admin");
  assert(resolveRoleForUser('customer@gmail.com', 'John Customer') === ROLES.CUSTOMER, "resolveRoleForUser identifies regular user as CUSTOMER");
  assert(resolveRoleForUser('vladimir@gmail.com', 'Vladimir') === ROLES.CUSTOMER, "resolveRoleForUser does not false-positive on Vladimir");
} catch (e) {
  console.error("RBAC Tests error:", e);
}

// ----------------------------------------------------
// 6. CONNECTED BAKERY INVENTORY & PRODUCTION WORKFLOW TESTS (Section 28)
// ----------------------------------------------------
console.log("\n6. Testing Connected Bakery Inventory & Production Workflow (Section 28)...");

try {
  const workflow = BakeryWorkflowManager.getInstance();
  const shop = ShopManager.getInstance();

  // Test 1: Admin adds ingredient: Flour 25 kg -> Verify Flour stock = 25
  console.log("\n  Test 1: Admin adds ingredient...");
  const flour = workflow.addIngredient({
    id: 'test-flour',
    name: 'All-Purpose Flour',
    category: 'Flour & Grains',
    quantity: 25,
    unit: 'kg',
    minimumStock: 10,
    reorderLevel: 15
  }, 'Store Owner / Admin');

  assert(flour.quantity === 25, "Test 1: Admin adds Flour 25 kg, stock equals 25 kg");
  assert(workflow.getIngredientById('test-flour').quantity === 25, "Test 1: Flour stock verified via getIngredientById");

  // Test 2: Admin restocks ingredient: Flour +10 kg -> Verify Flour stock = 35
  console.log("\n  Test 2: Admin restocks ingredient...");
  const restockedFlour = workflow.addIngredientStock('test-flour', 10, 'New Supplier Delivery', 'Bakery Supply Co.', 'Store Owner / Admin');
  assert(restockedFlour.quantity === 35, "Test 2: Admin restocks +10 kg, Flour stock equals 35 kg");
  assert(workflow.getIngredientById('test-flour').quantity === 35, "Test 2: Persisted stock is 35 kg");

  // Set up recipe for Pandesal: 10 Pandesal = 1 kg Flour
  workflow.saveRecipe({
    id: 'test-recipe-pandesal',
    productId: 'test-pandesal',
    productName: 'Pandesal',
    baseQuantity: 10,
    unit: 'pcs',
    ingredients: [
      { ingredientId: 'test-flour', ingredientName: 'All-Purpose Flour', quantity: 1, unit: 'kg' }
    ]
  });

  // Test 3: Baker produces 30 Pandesal. Recipe: 10 Pandesal = 1 kg Flour. System deducts 3 kg Flour. Verify Flour stock = 32
  console.log("\n  Test 3: Baker produces 30 Pandesal (auto-deduct 3 kg Flour)...");
  const pandesalReq = workflow.createProductionRequest({
    productId: 'test-pandesal',
    productName: 'Pandesal',
    requestedQuantity: 30,
    currentStock: 8,
    minimumStock: 20
  });

  const batch1 = workflow.completeProduction({
    requestId: pandesalReq.id,
    productName: 'Pandesal',
    productId: 'test-pandesal',
    quantity: 30,
    bakerName: 'Master Baker'
  });

  assert(batch1.status === 'Ready for Cashier', "Test 3: Batch status is 'Ready for Cashier'");
  assert(workflow.getIngredientById('test-flour').quantity === 32, "Test 3: Flour stock decreased from 35 kg to 32 kg (-3 kg)");

  // Test 4: Attempt production when ingredient is insufficient -> Verify production fails with shortage error
  console.log("\n  Test 4: Attempt production when ingredient is insufficient...");
  let errorCaught = false;
  let shortageMsg = '';
  try {
    // Attempt to produce 400 Pandesal (requires 40 kg flour, only 32 kg available -> shortage 8 kg)
    workflow.completeProduction({
      productName: 'Pandesal',
      productId: 'test-pandesal',
      quantity: 400,
      bakerName: 'Master Baker'
    });
  } catch (err) {
    errorCaught = true;
    shortageMsg = err.message;
  }
  assert(errorCaught === true, "Test 4: Insufficient ingredient throws an error");
  assert(shortageMsg.includes("insufficient") || shortageMsg.includes("shortage"), "Test 4: Error message specifies shortage");
  assert(workflow.getIngredientById('test-flour').quantity === 32, "Test 4: Flour stock untouched at 32 kg after failed attempt");

  // Test 5: Finished pastry production output status = Ready for Cashier -> Verify Cashier stock not yet changed
  console.log("\n  Test 5: Verify Cashier stock not changed while batch is Ready for Cashier...");
  let pandesalProduct = shop.getProducts().find(p => p.name.toLowerCase() === 'pandesal');
  if (pandesalProduct) {
    shop.updateStock(pandesalProduct.id, 8);
  } else {
    pandesalProduct = shop.addProduct({
      name: 'Pandesal',
      category: 'Bread',
      price: 15,
      stock: 8,
      minimumStock: 20,
      productionBatchSize: 30
    });
  }
  assert(shop.getProductById(pandesalProduct.id).stock === 8, "Test 5: Cashier stock remains 8 pcs before receiving batch");
  assert(batch1.status === 'Ready for Cashier', "Test 5: Batch remains 'Ready for Cashier'");

  // Test 6: Cashier receives production output -> Verify Cashier stock increases
  console.log("\n  Test 6: Cashier receives production output...");
  workflow.receiveProductionBatch(batch1.id, 'Cashier Jane', shop);
  assert(shop.getProductById(pandesalProduct.id).stock === 38, "Test 6: Cashier stock increases from 8 to 38 pcs (+30 pcs)");
  assert(workflow.getProductionBatches().find(b => b.id === batch1.id).status === 'Received', "Test 6: Batch status transitions to 'Received'");

  // Test 7: Cashier sells pastry -> Verify Cashier stock decreases
  console.log("\n  Test 7: Cashier sells pastry (5 Pandesal)...");
  shop.completeSale({
    cart: [{ id: pandesalProduct.id, name: 'Pandesal', price: 15, quantity: 5 }],
    customerLabel: 'Walk-in Customer'
  });
  assert(shop.getProductById(pandesalProduct.id).stock === 33, "Test 7: Cashier stock decreases from 38 to 33 pcs after selling 5");

  // Test 8: Cashier stock <= minimum stock -> Verify production request automatically created
  console.log("\n  Test 8: Cashier stock drops <= minimum stock (trigger production request)...");
  shop.updateStock(pandesalProduct.id, 15);
  const activeRequests = workflow.getProductionRequests().filter(r => 
    (r.productId === String(pandesalProduct.id) || r.productName === 'Pandesal') &&
    ['Pending', 'Accepted', 'Preparing'].includes(r.status)
  );
  assert(activeRequests.length >= 1, "Test 8: Production request automatically generated when stock <= minimumStock");
  assert(activeRequests[0].requestedQuantity === (pandesalProduct.productionBatchSize || 30), "Test 8: Request quantity matches productionBatchSize (30)");

  // Test 9: Verify duplicate production requests are NOT created
  console.log("\n  Test 9: Verify duplicate production requests are NOT created...");
  const initialReqCount = workflow.getProductionRequests().length;
  workflow.checkAndTriggerLowStock(shop.getProducts());
  const finalReqCount = workflow.getProductionRequests().length;
  assert(initialReqCount === finalReqCount, "Test 9: No duplicate production request created for same low-stock product");

  // Test 10: Verify ingredient stock never drops below 0
  console.log("\n  Test 10: Verify ingredient stock never drops below 0...");
  const currentFlourStock = workflow.getIngredientById('test-flour').quantity;
  assert(currentFlourStock >= 0, "Test 10: Ingredient quantity is positive");
  let preventedNegative = false;
  try {
    workflow.completeProduction({
      productName: 'Pandesal',
      productId: 'test-pandesal',
      quantity: 9999,
      bakerName: 'Master Baker'
    });
  } catch (err) {
    preventedNegative = true;
  }
  assert(preventedNegative === true, "Test 10: System blocks deduction that would drop ingredient stock below 0");
  assert(workflow.getIngredientById('test-flour').quantity >= 0, "Test 10: Flour stock remains >= 0");

  // Test 11: Verify finished product stock never drops below 0
  console.log("\n  Test 11: Verify finished product stock never drops below 0...");
  let saleBlocked = false;
  try {
    shop.completeSale({
      cart: [{ id: pandesalProduct.id, name: 'Pandesal', price: 15, quantity: 9999 }],
      customerLabel: 'Oversell attempt'
    });
  } catch (err) {
    saleBlocked = true;
  }
  assert(saleBlocked === true, "Test 11: Oversell is rejected by ShopManager");
  assert(shop.getProductById(pandesalProduct.id).stock >= 0, "Test 11: Finished product stock remains >= 0");

  // Test 12: Verify inventory history transactions are created for all actions
  console.log("\n  Test 12: Verify inventory history transactions created for all actions...");
  const txs = workflow.getInventoryTransactions();
  assert(txs.length > 0, "Test 12: Transactions recorded in inventory audit log");

  const hasRestockTx = txs.some(t => t.type?.toLowerCase().includes('delivery') || t.type?.toLowerCase().includes('restock'));
  assert(hasRestockTx, "Test 12: Supplier Restock transaction recorded");

  const hasBakerTx = txs.some(t => t.type?.toLowerCase().includes('production used') || t.type?.toLowerCase().includes('deduction'));
  assert(hasBakerTx, "Test 12: Baker production deduction transaction recorded");

  const hasReceiveTx = txs.some(t => t.type?.toLowerCase().includes('received'));
  assert(hasReceiveTx, "Test 12: Cashier receiving transaction recorded");

  const hasSaleTx = txs.some(t => t.type?.toLowerCase().includes('sale'));
  assert(hasSaleTx, "Test 12: Customer sale transaction recorded");
} catch (e) {
  console.error("Workflow Tests error:", e);
  throw e;
}

console.log("\n==========================================");
console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log("==========================================");


