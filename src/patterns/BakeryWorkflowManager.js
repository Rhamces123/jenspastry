// ==========================================
// Jen's Pastry Shop - Bakery Workflow Manager
// Singleton Pattern & Central Inventory Audit System
// Connects Admin (Ingredients), Baker (Production), and Cashier (Stock & Sales)
// ==========================================

import { db, isFirebaseConfigured } from '../firebase.js';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  addDoc 
} from 'firebase/firestore';

// Initial Raw Ingredients
export const INITIAL_INGREDIENTS = [
  {
    id: 'ing-flour',
    name: 'All-Purpose Flour',
    category: 'Flour & Grains',
    quantity: 50,
    unit: 'kg',
    minimumStock: 10,
    reorderLevel: 15,
    supplier: 'Golden Wheat Milling Co.',
    status: 'in_stock',
    disabled: false,
    notes: 'Premium high-grade wheat baking flour'
  },
  {
    id: 'ing-sugar',
    name: 'Granulated White Sugar',
    category: 'Sweeteners & Flavors',
    quantity: 20,
    unit: 'kg',
    minimumStock: 10,
    reorderLevel: 15,
    supplier: 'Sweet Cane Refinery',
    status: 'in_stock',
    disabled: false,
    notes: 'Refined cane sugar for pastries'
  },
  {
    id: 'ing-eggs',
    name: 'Fresh Farm Eggs',
    category: 'Dairy & Eggs',
    quantity: 100,
    unit: 'pcs',
    minimumStock: 40,
    reorderLevel: 60,
    supplier: 'Sunrise Poultry Farms',
    status: 'in_stock',
    disabled: false,
    notes: 'Grade A fresh large eggs'
  },
  {
    id: 'ing-butter',
    name: 'Pure Unsalted Butter',
    category: 'Dairy & Eggs',
    quantity: 10,
    unit: 'kg',
    minimumStock: 5,
    reorderLevel: 8,
    supplier: 'Creamery Dairy Corp.',
    status: 'in_stock',
    disabled: false,
    notes: '82% butterfat European style'
  },
  {
    id: 'ing-milk',
    name: 'Fresh Whole Milk',
    category: 'Dairy & Eggs',
    quantity: 20,
    unit: 'L',
    minimumStock: 8,
    reorderLevel: 12,
    supplier: 'Valley Fresh Dairy',
    status: 'in_stock',
    disabled: false,
    notes: 'Pasteurized whole milk'
  },
  {
    id: 'ing-yeast',
    name: 'Active Dry Yeast',
    category: 'Leavening & Yeast',
    quantity: 5,
    unit: 'kg',
    minimumStock: 1.5,
    reorderLevel: 2.5,
    supplier: 'Bakers Choice Ingredients',
    status: 'in_stock',
    disabled: false,
    notes: 'Fast-acting dry yeast'
  },
  {
    id: 'ing-salt',
    name: 'Refined Iodized Salt',
    category: 'Spices & Seasonings',
    quantity: 5,
    unit: 'kg',
    minimumStock: 2,
    reorderLevel: 3,
    supplier: 'Pure Salt Minerals',
    status: 'in_stock',
    disabled: false,
    notes: 'Fine baking salt'
  },
  {
    id: 'ing-cheese',
    name: 'Cheddar Cheese Block',
    category: 'Dairy & Eggs',
    quantity: 8,
    unit: 'kg',
    minimumStock: 4,
    reorderLevel: 6,
    supplier: 'Golden Dairy Farms',
    status: 'in_stock',
    disabled: false,
    notes: 'Sharp grating cheddar for ensaymada & ube'
  },
  {
    id: 'ing-chocolate',
    name: 'Dark Cocoa / Chocolate',
    category: 'Sweeteners & Flavors',
    quantity: 10,
    unit: 'kg',
    minimumStock: 3,
    reorderLevel: 5,
    supplier: 'Belgian Cocoa Imports',
    status: 'in_stock',
    disabled: false,
    notes: '70% Dutch-processed dark cocoa'
  },
  {
    id: 'ing-ube',
    name: 'Pure Ube Halaya / Puree',
    category: 'Fruits & Fillings',
    quantity: 10,
    unit: 'kg',
    minimumStock: 3,
    reorderLevel: 5,
    supplier: 'Bohol Ube Cooperative',
    status: 'in_stock',
    disabled: false,
    notes: 'Authentic purple yam paste'
  },
  {
    id: 'ing-cream',
    name: 'Heavy Whipping Cream',
    category: 'Dairy & Eggs',
    quantity: 10,
    unit: 'L',
    minimumStock: 4,
    reorderLevel: 6,
    supplier: 'Creamery Dairy Corp.',
    status: 'in_stock',
    disabled: false,
    notes: '36% whipping cream for cakes & frosting'
  },
  {
    id: 'ing-oil',
    name: 'Pure Vegetable Cooking Oil',
    category: 'Fats & Oils',
    quantity: 15,
    unit: 'L',
    minimumStock: 5,
    reorderLevel: 8,
    supplier: 'Golden Sun Oils',
    status: 'in_stock',
    disabled: false,
    notes: 'Refined palm/coconut cooking oil'
  },
  {
    id: 'ing-coconut',
    name: 'Sweet Grated Coconut',
    category: 'Fruits & Fillings',
    quantity: 8,
    unit: 'kg',
    minimumStock: 2,
    reorderLevel: 4,
    supplier: 'Tropical Coconut Milling',
    status: 'in_stock',
    disabled: false,
    notes: 'Desiccated grated coconut for pan de coco'
  },
  {
    id: 'ing-vanilla',
    name: 'Pure Vanilla Extract',
    category: 'Sweeteners & Flavors',
    quantity: 2,
    unit: 'L',
    minimumStock: 0.5,
    reorderLevel: 1,
    supplier: 'Spice Island Flavors',
    status: 'in_stock',
    disabled: false,
    notes: 'Bourbon vanilla bean extract'
  }
];

// Initial Pastry Recipes
export const INITIAL_RECIPES = [
  {
    id: 'recipe-pandesal',
    productId: 'pandesal',
    productName: 'Pandesal',
    baseQuantity: 10,
    unit: 'pcs',
    instructions: 'Knead dough until smooth, roll in breadcrumbs, bake at 180°C for 15 minutes.',
    ingredients: [
      { ingredientId: 'ing-flour', ingredientName: 'All-Purpose Flour', quantity: 1.0, unit: 'kg' },
      { ingredientId: 'ing-sugar', ingredientName: 'Granulated White Sugar', quantity: 0.20, unit: 'kg' },
      { ingredientId: 'ing-yeast', ingredientName: 'Active Dry Yeast', quantity: 0.02, unit: 'kg' },
      { ingredientId: 'ing-salt', ingredientName: 'Refined Iodized Salt', quantity: 0.01, unit: 'kg' },
      { ingredientId: 'ing-milk', ingredientName: 'Fresh Whole Milk', quantity: 0.50, unit: 'L' }
    ]
  },
  {
    id: 'recipe-ensaymada',
    productId: 'ensaymada',
    productName: 'Ensaymada',
    baseQuantity: 10,
    unit: 'pcs',
    instructions: 'Brioche dough proofed twice, brushed with soft butter, topped with grated cheese and sugar.',
    ingredients: [
      { ingredientId: 'ing-flour', ingredientName: 'All-Purpose Flour', quantity: 1.20, unit: 'kg' },
      { ingredientId: 'ing-butter', ingredientName: 'Pure Unsalted Butter', quantity: 0.30, unit: 'kg' },
      { ingredientId: 'ing-sugar', ingredientName: 'Granulated White Sugar', quantity: 0.25, unit: 'kg' },
      { ingredientId: 'ing-eggs', ingredientName: 'Fresh Farm Eggs', quantity: 4, unit: 'pcs' },
      { ingredientId: 'ing-cheese', ingredientName: 'Cheddar Cheese Block', quantity: 0.20, unit: 'kg' },
      { ingredientId: 'ing-yeast', ingredientName: 'Active Dry Yeast', quantity: 0.02, unit: 'kg' }
    ]
  },
  {
    id: 'recipe-monay',
    productId: 'monay',
    productName: 'Monay',
    baseQuantity: 10,
    unit: 'pcs',
    instructions: 'Dense dough slashed down the middle before baking to form classic shape.',
    ingredients: [
      { ingredientId: 'ing-flour', ingredientName: 'All-Purpose Flour', quantity: 1.0, unit: 'kg' },
      { ingredientId: 'ing-sugar', ingredientName: 'Granulated White Sugar', quantity: 0.15, unit: 'kg' },
      { ingredientId: 'ing-milk', ingredientName: 'Fresh Whole Milk', quantity: 0.30, unit: 'L' },
      { ingredientId: 'ing-butter', ingredientName: 'Pure Unsalted Butter', quantity: 0.10, unit: 'kg' },
      { ingredientId: 'ing-yeast', ingredientName: 'Active Dry Yeast', quantity: 0.02, unit: 'kg' }
    ]
  },
  {
    id: 'recipe-siopao',
    productId: 'siopao',
    productName: 'Siopao',
    baseQuantity: 10,
    unit: 'pcs',
    instructions: 'Steamed fluffy white yeast buns filled with savory filling.',
    ingredients: [
      { ingredientId: 'ing-flour', ingredientName: 'All-Purpose Flour', quantity: 0.80, unit: 'kg' },
      { ingredientId: 'ing-sugar', ingredientName: 'Granulated White Sugar', quantity: 0.10, unit: 'kg' },
      { ingredientId: 'ing-oil', ingredientName: 'Pure Vegetable Cooking Oil', quantity: 0.05, unit: 'L' },
      { ingredientId: 'ing-yeast', ingredientName: 'Active Dry Yeast', quantity: 0.015, unit: 'kg' }
    ]
  },
  {
    id: 'recipe-pan-de-coco',
    productId: 'pan de coco',
    productName: 'Pan de Coco',
    baseQuantity: 10,
    unit: 'pcs',
    instructions: 'Sweet yeast rolls filled with sweetened shredded coconut.',
    ingredients: [
      { ingredientId: 'ing-flour', ingredientName: 'All-Purpose Flour', quantity: 1.0, unit: 'kg' },
      { ingredientId: 'ing-sugar', ingredientName: 'Granulated White Sugar', quantity: 0.30, unit: 'kg' },
      { ingredientId: 'ing-coconut', ingredientName: 'Sweet Grated Coconut', quantity: 0.40, unit: 'kg' },
      { ingredientId: 'ing-butter', ingredientName: 'Pure Unsalted Butter', quantity: 0.15, unit: 'kg' },
      { ingredientId: 'ing-yeast', ingredientName: 'Active Dry Yeast', quantity: 0.02, unit: 'kg' }
    ]
  },
  {
    id: 'recipe-loaf-bread',
    productId: 'loaf bread',
    productName: 'Loaf Bread',
    baseQuantity: 2,
    unit: 'pcs',
    instructions: 'Sandwich loaf baked in lidded Pullman pans for even crumb.',
    ingredients: [
      { ingredientId: 'ing-flour', ingredientName: 'All-Purpose Flour', quantity: 1.0, unit: 'kg' },
      { ingredientId: 'ing-sugar', ingredientName: 'Granulated White Sugar', quantity: 0.10, unit: 'kg' },
      { ingredientId: 'ing-butter', ingredientName: 'Pure Unsalted Butter', quantity: 0.08, unit: 'kg' },
      { ingredientId: 'ing-milk', ingredientName: 'Fresh Whole Milk', quantity: 0.40, unit: 'L' },
      { ingredientId: 'ing-yeast', ingredientName: 'Active Dry Yeast', quantity: 0.015, unit: 'kg' }
    ]
  },
  {
    id: 'recipe-dinner-rolls',
    productId: 'dinner rolls',
    productName: 'Dinner Rolls',
    baseQuantity: 12,
    unit: 'pcs',
    instructions: 'Soft dinner rolls baked closely in a pan to stay tender.',
    ingredients: [
      { ingredientId: 'ing-flour', ingredientName: 'All-Purpose Flour', quantity: 0.80, unit: 'kg' },
      { ingredientId: 'ing-butter', ingredientName: 'Pure Unsalted Butter', quantity: 0.15, unit: 'kg' },
      { ingredientId: 'ing-sugar', ingredientName: 'Granulated White Sugar', quantity: 0.10, unit: 'kg' },
      { ingredientId: 'ing-milk', ingredientName: 'Fresh Whole Milk', quantity: 0.30, unit: 'L' },
      { ingredientId: 'ing-yeast', ingredientName: 'Active Dry Yeast', quantity: 0.015, unit: 'kg' }
    ]
  },
  {
    id: 'recipe-ube-pandesal',
    productId: 'ube pandesal',
    productName: 'Ube Pandesal',
    baseQuantity: 10,
    unit: 'pcs',
    instructions: 'Vibrant purple yam dough stuffed with quick-melt cheddar cheese chunk.',
    ingredients: [
      { ingredientId: 'ing-flour', ingredientName: 'All-Purpose Flour', quantity: 1.0, unit: 'kg' },
      { ingredientId: 'ing-ube', ingredientName: 'Pure Ube Halaya / Puree', quantity: 0.30, unit: 'kg' },
      { ingredientId: 'ing-cheese', ingredientName: 'Cheddar Cheese Block', quantity: 0.20, unit: 'kg' },
      { ingredientId: 'ing-sugar', ingredientName: 'Granulated White Sugar', quantity: 0.20, unit: 'kg' },
      { ingredientId: 'ing-yeast', ingredientName: 'Active Dry Yeast', quantity: 0.02, unit: 'kg' }
    ]
  },
  {
    id: 'recipe-croissant',
    productId: 'croissant',
    productName: 'Croissant',
    baseQuantity: 10,
    unit: 'pcs',
    instructions: 'Laminated pastry dough with alternating layers of French butter and dough.',
    ingredients: [
      { ingredientId: 'ing-flour', ingredientName: 'All-Purpose Flour', quantity: 1.0, unit: 'kg' },
      { ingredientId: 'ing-butter', ingredientName: 'Pure Unsalted Butter', quantity: 0.50, unit: 'kg' },
      { ingredientId: 'ing-sugar', ingredientName: 'Granulated White Sugar', quantity: 0.10, unit: 'kg' },
      { ingredientId: 'ing-milk', ingredientName: 'Fresh Whole Milk', quantity: 0.30, unit: 'L' },
      { ingredientId: 'ing-yeast', ingredientName: 'Active Dry Yeast', quantity: 0.02, unit: 'kg' }
    ]
  },
  {
    id: 'recipe-chocolate-cake',
    productId: 'chocolate cake',
    productName: 'Chocolate Cake',
    baseQuantity: 1,
    unit: 'pcs',
    instructions: 'Moist rich chocolate sponge frosted with dark chocolate ganache.',
    ingredients: [
      { ingredientId: 'ing-flour', ingredientName: 'All-Purpose Flour', quantity: 0.50, unit: 'kg' },
      { ingredientId: 'ing-sugar', ingredientName: 'Granulated White Sugar', quantity: 0.40, unit: 'kg' },
      { ingredientId: 'ing-chocolate', ingredientName: 'Dark Cocoa / Chocolate', quantity: 0.30, unit: 'kg' },
      { ingredientId: 'ing-eggs', ingredientName: 'Fresh Farm Eggs', quantity: 4, unit: 'pcs' },
      { ingredientId: 'ing-butter', ingredientName: 'Pure Unsalted Butter', quantity: 0.20, unit: 'kg' },
      { ingredientId: 'ing-milk', ingredientName: 'Fresh Whole Milk', quantity: 0.25, unit: 'L' }
    ]
  }
];

const STORAGE_KEYS = {
  INGREDIENTS: 'bakeology_ingredients_v2',
  RECIPES: 'bakeology_recipes_v2',
  PRODUCTION_REQUESTS: 'bakeology_production_requests_v2',
  PRODUCTION_BATCHES: 'bakeology_production_batches_v2',
  TRANSACTIONS: 'bakeology_inventory_tx_v2',
  NOTIFICATIONS: 'bakeology_workflow_notifications_v2'
};

class BakeryWorkflowManager {
  static #instance = null;

  constructor() {
    if (BakeryWorkflowManager.#instance) {
      throw new Error("Use BakeryWorkflowManager.getInstance() for singleton access.");
    }

    this.ingredients = [];
    this.recipes = [];
    this.productionRequests = [];
    this.productionBatches = [];
    this.inventoryTransactions = [];
    this.notifications = [];
    this.subscribers = [];

    this.initializeData();
  }

  static getInstance() {
    if (!BakeryWorkflowManager.#instance) {
      BakeryWorkflowManager.#instance = new BakeryWorkflowManager();
    }
    return BakeryWorkflowManager.#instance;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error("BakeryWorkflowManager notification error:", e);
      }
    });
  }

  // Load from LocalStorage or seed defaults
  initializeData() {
    try {
      // 1. Ingredients
      const storedIngs = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
      if (storedIngs) {
        this.ingredients = JSON.parse(storedIngs);
      } else {
        this.ingredients = INITIAL_INGREDIENTS.map(ing => ({
          ...ing,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        this.persistIngredients();
      }

      // 2. Recipes
      const storedRecipes = localStorage.getItem(STORAGE_KEYS.RECIPES);
      if (storedRecipes) {
        this.recipes = JSON.parse(storedRecipes);
      } else {
        this.recipes = INITIAL_RECIPES.map(r => ({
          ...r,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        this.persistRecipes();
      }

      // 3. Production Requests
      const storedReqs = localStorage.getItem(STORAGE_KEYS.PRODUCTION_REQUESTS);
      this.productionRequests = storedReqs ? JSON.parse(storedReqs) : [];

      // 4. Production Batches
      const storedBatches = localStorage.getItem(STORAGE_KEYS.PRODUCTION_BATCHES);
      this.productionBatches = storedBatches ? JSON.parse(storedBatches) : [];

      // 5. Inventory Transactions
      const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      this.inventoryTransactions = storedTx ? JSON.parse(storedTx) : [];

      // 6. Notifications
      const storedNotes = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      this.notifications = storedNotes ? JSON.parse(storedNotes) : [];

      // Initial seeding transaction if transactions are empty
      if (this.inventoryTransactions.length === 0) {
        const seedTx = this.ingredients.map((ing, i) => ({
          id: `TX-INIT-${i + 1}`,
          type: 'Supplier Delivery',
          inventoryType: 'ingredient',
          itemId: ing.id,
          itemName: ing.name,
          quantityChange: ing.quantity,
          unit: ing.unit,
          previousStock: 0,
          newStock: ing.quantity,
          referenceId: 'INIT-SUPPLY',
          reason: 'Initial Bakery Pantry Setup',
          performedBy: 'Store Owner / Admin',
          performedByRole: 'admin',
          timestamp: new Date().toISOString()
        }));
        this.inventoryTransactions = seedTx;
        this.persistTransactions();
      }
    } catch (err) {
      console.warn("BakeryWorkflowManager initialization warning:", err);
      this.ingredients = INITIAL_INGREDIENTS;
      this.recipes = INITIAL_RECIPES;
    }

    // Attempt background Firestore sync
    this.syncFromFirestore();
  }

  async syncFromFirestore() {
    if (!isFirebaseConfigured() || !db) return;
    try {
      // Async pull from Firestore if available
      const ingSnap = await getDocs(collection(db, 'ingredients'));
      if (!ingSnap.empty) {
        const ings = [];
        ingSnap.forEach(d => ings.push({ id: d.id, ...d.data() }));
        if (ings.length > 0) {
          this.ingredients = ings;
          this.persistIngredients();
        }
      }

      const recipeSnap = await getDocs(collection(db, 'recipes'));
      if (!recipeSnap.empty) {
        const recs = [];
        recipeSnap.forEach(d => recs.push({ id: d.id, ...d.data() }));
        if (recs.length > 0) {
          this.recipes = recs;
          this.persistRecipes();
        }
      }

      this.notify();
    } catch (e) {
      console.warn("Firestore background sync skipped:", e.message);
    }
  }

  // ==========================================
  // PERSISTENCE HELPERS
  // ==========================================
  persistIngredients() {
    try {
      localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(this.ingredients));
    } catch (e) {
      console.warn("Could not save ingredients locally:", e);
    }
  }

  persistRecipes() {
    try {
      localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(this.recipes));
    } catch (e) {
      console.warn("Could not save recipes locally:", e);
    }
  }

  persistProductionRequests() {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTION_REQUESTS, JSON.stringify(this.productionRequests));
    } catch (e) {
      console.warn("Could not save production requests locally:", e);
    }
  }

  persistProductionBatches() {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTION_BATCHES, JSON.stringify(this.productionBatches));
    } catch (e) {
      console.warn("Could not save production batches locally:", e);
    }
  }

  persistTransactions() {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.inventoryTransactions));
    } catch (e) {
      console.warn("Could not save transactions locally:", e);
    }
  }

  persistNotifications() {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
    } catch (e) {
      console.warn("Could not save notifications locally:", e);
    }
  }

  // ==========================================
  // INGREDIENT INVENTORY (STORE OWNER / ADMIN)
  // ==========================================
  getIngredients() {
    return [...this.ingredients];
  }

  getIngredientById(id) {
    return this.ingredients.find(i => i.id === id);
  }

  /**
   * Helper to derive stock status
   */
  calculateIngredientStatus(qty, minStock, disabled = false) {
    if (disabled) return 'disabled';
    const numQty = Number(qty) || 0;
    const numMin = Number(minStock) || 0;
    if (numQty <= 0) return 'out_of_stock';
    if (numQty <= numMin) return 'low_stock';
    return 'in_stock';
  }

  /**
   * Admin adds a brand new ingredient to bakery pantry.
   */
  addIngredient(data, performedBy = 'Store Owner / Admin') {
    if (!data.name || !data.name.trim()) {
      throw new Error("Ingredient name is required.");
    }
    const quantity = Math.max(0, Number(data.quantity) || 0);
    const minimumStock = Math.max(0, Number(data.minimumStock) || 5);
    const reorderLevel = Math.max(minimumStock, Number(data.reorderLevel) || (minimumStock + 5));

    const id = data.id || `ing-${Date.now()}`;
    const newIngredient = {
      id,
      name: data.name.trim(),
      category: data.category || 'Baking Ingredient',
      quantity,
      unit: data.unit || 'kg',
      minimumStock,
      reorderLevel,
      supplier: data.supplier ? data.supplier.trim() : '',
      expirationDate: data.expirationDate || '',
      notes: data.notes ? data.notes.trim() : '',
      status: this.calculateIngredientStatus(quantity, minimumStock, false),
      disabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.ingredients = [newIngredient, ...this.ingredients];
    this.persistIngredients();

    // Log transaction
    this.recordTransaction({
      type: 'Supplier Delivery',
      inventoryType: 'ingredient',
      itemId: newIngredient.id,
      itemName: newIngredient.name,
      quantityChange: quantity,
      unit: newIngredient.unit,
      previousStock: 0,
      newStock: quantity,
      referenceId: 'NEW-ING',
      reason: data.notes || 'New Ingredient Initial Stock',
      performedBy,
      performedByRole: 'admin'
    });

    // Write to Firestore if connected
    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, 'ingredients', id), newIngredient)
        .catch(err => console.warn("Firestore addIngredient sync error:", err));
    }

    this.notify();
    return newIngredient;
  }

  /**
   * Admin updates ingredient details (min stock, reorder level, name, etc.)
   */
  updateIngredient(id, updatedFields) {
    const index = this.ingredients.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Ingredient "${id}" not found.`);
    }

    const current = this.ingredients[index];
    const qty = updatedFields.quantity !== undefined ? Math.max(0, Number(updatedFields.quantity)) : current.quantity;
    const minStock = updatedFields.minimumStock !== undefined ? Number(updatedFields.minimumStock) : current.minimumStock;
    const disabled = updatedFields.disabled !== undefined ? Boolean(updatedFields.disabled) : current.disabled;

    const updated = {
      ...current,
      ...updatedFields,
      quantity: qty,
      minimumStock: minStock,
      reorderLevel: updatedFields.reorderLevel !== undefined ? Number(updatedFields.reorderLevel) : current.reorderLevel,
      disabled,
      status: this.calculateIngredientStatus(qty, minStock, disabled),
      updatedAt: new Date().toISOString()
    };

    this.ingredients[index] = updated;
    this.persistIngredients();

    if (isFirebaseConfigured() && db) {
      updateDoc(doc(db, 'ingredients', id), updated)
        .catch(err => console.warn("Firestore updateIngredient sync error:", err));
    }

    this.notify();
    return updated;
  }

  /**
   * Admin restocks an existing ingredient.
   * Creates an inventory audit transaction.
   */
  addIngredientStock(id, amountToAdd, reason = 'New Supplier Delivery', supplier = '', performedBy = 'Store Owner / Admin') {
    const index = this.ingredients.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Ingredient "${id}" not found.`);
    }

    const numAdd = Number(amountToAdd);
    if (isNaN(numAdd) || numAdd <= 0) {
      throw new Error("Stock amount to add must be greater than zero.");
    }

    const current = this.ingredients[index];
    const previousStock = current.quantity;
    const newStock = Math.round((previousStock + numAdd) * 100) / 100;

    const updated = {
      ...current,
      quantity: newStock,
      status: this.calculateIngredientStatus(newStock, current.minimumStock, current.disabled),
      updatedAt: new Date().toISOString()
    };

    this.ingredients[index] = updated;
    this.persistIngredients();

    // Log transaction
    this.recordTransaction({
      type: 'Supplier Delivery',
      inventoryType: 'ingredient',
      itemId: current.id,
      itemName: current.name,
      quantityChange: numAdd,
      unit: current.unit,
      previousStock,
      newStock,
      referenceId: supplier ? `SUP-${supplier.slice(0, 8)}` : 'DELIVERY',
      reason: reason || 'New Supplier Delivery',
      performedBy,
      performedByRole: 'admin'
    });

    if (isFirebaseConfigured() && db) {
      updateDoc(doc(db, 'ingredients', id), {
        quantity: newStock,
        status: updated.status,
        updatedAt: updated.updatedAt
      }).catch(err => console.warn("Firestore addIngredientStock sync error:", err));
    }

    this.notify();
    return updated;
  }

  /**
   * Enable/Disable an ingredient
   */
  toggleIngredientDisabled(id) {
    const ing = this.getIngredientById(id);
    if (!ing) return;
    return this.updateIngredient(id, { disabled: !ing.disabled });
  }

  // ==========================================
  // RECIPES & QUANTITY CALCULATION
  // ==========================================
  getRecipes() {
    return [...this.recipes];
  }

  /**
   * Finds the recipe for a product by ID or normalized name
   */
  getRecipeForProduct(productOrName) {
    if (!productOrName) return null;
    const targetName = (typeof productOrName === 'string' ? productOrName : (productOrName.name || '')).trim().toLowerCase();
    const targetId = typeof productOrName === 'object' && productOrName.id ? String(productOrName.id).toLowerCase() : '';

    return this.recipes.find(r => 
      (r.productId && (r.productId.toLowerCase() === targetId || r.productId.toLowerCase() === targetName)) ||
      (r.productName && r.productName.toLowerCase() === targetName)
    ) || null;
  }

  /**
   * Admin saves or updates a recipe
   */
  saveRecipe(recipeData) {
    if (!recipeData.productName || !recipeData.ingredients || recipeData.ingredients.length === 0) {
      throw new Error("Recipe must specify a product name and at least one ingredient.");
    }

    const baseQuantity = Math.max(1, Number(recipeData.baseQuantity) || 10);
    const existingIndex = this.recipes.findIndex(r => 
      r.id === recipeData.id || 
      (r.productName && r.productName.toLowerCase() === recipeData.productName.toLowerCase())
    );

    const recipe = {
      id: recipeData.id || `recipe-${Date.now()}`,
      productId: recipeData.productId || recipeData.productName.toLowerCase().replace(/\s+/g, '-'),
      productName: recipeData.productName.trim(),
      baseQuantity,
      unit: recipeData.unit || 'pcs',
      instructions: recipeData.instructions ? recipeData.instructions.trim() : '',
      ingredients: recipeData.ingredients.map(ing => ({
        ingredientId: ing.ingredientId,
        ingredientName: ing.ingredientName || ing.name,
        quantity: Math.max(0.001, Number(ing.quantity) || 0),
        unit: ing.unit || 'kg'
      })),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      this.recipes[existingIndex] = { ...this.recipes[existingIndex], ...recipe };
    } else {
      recipe.createdAt = new Date().toISOString();
      this.recipes = [recipe, ...this.recipes];
    }

    this.persistRecipes();

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, 'recipes', recipe.id), recipe)
        .catch(err => console.warn("Firestore saveRecipe sync error:", err));
    }

    this.notify();
    return recipe;
  }

  /**
   * Implements Section 9 Formula:
   * Required Ingredient = Recipe Ingredient Quantity * Production Quantity / Recipe Base Quantity
   */
  calculateRequiredIngredients(recipe, productionQuantity) {
    if (!recipe || !recipe.ingredients) return [];
    const prodQty = Number(productionQuantity) || 0;
    const baseQty = Number(recipe.baseQuantity) || 1;

    return recipe.ingredients.map(ing => {
      const required = Math.round(((Number(ing.quantity) * prodQty) / baseQty) * 1000) / 1000;
      const currentStockItem = this.getIngredientById(ing.ingredientId);
      const available = currentStockItem ? currentStockItem.quantity : 0;
      const shortage = Math.max(0, Math.round((required - available) * 1000) / 1000);

      return {
        ingredientId: ing.ingredientId,
        ingredientName: ing.ingredientName || (currentStockItem ? currentStockItem.name : 'Unknown Ingredient'),
        recipeQuantity: Number(ing.quantity),
        required,
        available,
        shortage,
        isSufficient: available >= required,
        unit: ing.unit || (currentStockItem ? currentStockItem.unit : 'kg')
      };
    });
  }

  /**
   * Section 10: Checks if enough ingredients are available before Baker starts production.
   */
  checkIngredientsSufficiency(recipe, productionQuantity) {
    if (!recipe) {
      return { sufficient: true, shortages: [], breakdown: [] };
    }
    const breakdown = this.calculateRequiredIngredients(recipe, productionQuantity);
    const shortages = breakdown.filter(b => !b.isSufficient);

    return {
      sufficient: shortages.length === 0,
      shortages,
      breakdown
    };
  }

  // ==========================================
  // PRODUCTION QUEUE & WORKFLOW (BAKER & CASHIER)
  // ==========================================
  getProductionRequests() {
    return [...this.productionRequests];
  }

  getProductionBatches() {
    return [...this.productionBatches];
  }

  /**
   * Section 15: Automatically or manually create a Production Request.
   * Enforces Section 15 rule: Do NOT continuously create duplicate production requests
   * for the same low-stock product if an active request already exists.
   */
  createProductionRequest({
    productId,
    productName,
    requestedQuantity,
    priority = 'High',
    currentStock = 0,
    minimumStock = 20,
    triggeredBy = 'Low Stock Automation',
    notes = ''
  }) {
    // Check for active duplicate request
    const activeStatuses = ['Pending', 'Accepted', 'Preparing', 'Completed', 'Ready for Cashier'];
    const existingActive = this.productionRequests.find(r => 
      (r.productId === productId || (r.productName && r.productName.toLowerCase() === productName.toLowerCase())) &&
      activeStatuses.includes(r.status)
    );

    if (existingActive) {
      return existingActive; // Return existing active request, prevent duplicates!
    }

    const nextNumber = this.productionRequests.length + 1;
    const id = `REQ-${String(nextNumber).padStart(3, '0')}`;
    const newRequest = {
      id,
      requestNumber: id,
      productId: String(productId),
      productName,
      requestedQuantity: Number(requestedQuantity) || 30,
      currentStock: Number(currentStock),
      minimumStock: Number(minimumStock),
      priority,
      status: 'Pending',
      triggeredBy,
      notes: notes || `Auto-generated: Current stock (${currentStock}) is below minimum (${minimumStock})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.productionRequests = [newRequest, ...this.productionRequests];
    this.persistProductionRequests();

    // Create Notification for Baker
    this.addNotification({
      type: 'baker_request',
      title: 'New Production Request',
      message: `${productName} stock is low (${currentStock} left). Production request created for ${newRequest.requestedQuantity} pieces.`,
      targetRole: 'baker',
      referenceId: id
    });

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, 'productionRequests', id), newRequest)
        .catch(err => console.warn("Firestore createProductionRequest error:", err));
    }

    this.notify();
    return newRequest;
  }

  /**
   * Evaluates finished pastry inventory and triggers production requests for low items
   */
  checkAndTriggerLowStock(productsList) {
    if (!productsList || !Array.isArray(productsList)) return;

    productsList.forEach(product => {
      const stock = Number(product.stock) || 0;
      const minStock = Number(product.minimumStock) || 20;
      const batchSize = Number(product.productionBatchSize) || 30;

      if (stock <= minStock) {
        this.createProductionRequest({
          productId: product.id,
          productName: product.name,
          requestedQuantity: batchSize,
          priority: stock === 0 ? 'Urgent' : 'High',
          currentStock: stock,
          minimumStock: minStock,
          triggeredBy: 'Low Stock Automation'
        });
      }
    });
  }

  /**
   * Advances Production Request status (Pending -> Accepted -> Preparing)
   */
  updateProductionRequestStatus(requestId, newStatus) {
    const index = this.productionRequests.findIndex(r => r.id === requestId);
    if (index === -1) return null;

    const updated = {
      ...this.productionRequests[index],
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    this.productionRequests[index] = updated;
    this.persistProductionRequests();

    if (isFirebaseConfigured() && db) {
      updateDoc(doc(db, 'productionRequests', requestId), {
        status: newStatus,
        updatedAt: updated.updatedAt
      }).catch(err => console.warn("Firestore updateProductionRequestStatus error:", err));
    }

    this.notify();
    return updated;
  }

  /**
   * Section 10 & 11: Baker starts production.
   * Verifies ingredients BEFORE starting.
   */
  startProduction(requestId, bakerName = 'Master Baker') {
    const req = this.productionRequests.find(r => r.id === requestId);
    if (!req) throw new Error(`Production request ${requestId} not found.`);

    const recipe = this.getRecipeForProduct({ id: req.productId, name: req.productName });
    if (recipe) {
      const check = this.checkIngredientsSufficiency(recipe, req.requestedQuantity);
      if (!check.sufficient) {
        const shortageText = check.shortages
          .map(s => `${s.ingredientName}: required ${s.required} ${s.unit}, available ${s.available} ${s.unit} (shortage: ${s.shortage} ${s.unit})`)
          .join('; ');
        throw new Error(`Insufficient ingredients for production. ${shortageText}`);
      }
    }

    return this.updateProductionRequestStatus(requestId, 'Preparing');
  }

  /**
   * Section 11 & 12: Baker confirms completed production.
   * 1. Checks ingredients stock again (transaction safety).
   * 2. Automatically deducts required ingredients.
   * 3. Prevents double deductions.
   * 4. Creates production batch with status "Ready for Cashier".
   * 5. Sets production request to "Ready for Cashier".
   * 6. Logs inventory transactions for every ingredient used.
   */
  completeProduction({
    requestId,
    productName,
    productId,
    quantity,
    bakerName = 'Master Baker'
  }) {
    let req = null;
    if (requestId) {
      req = this.productionRequests.find(r => r.id === requestId);
    }

    const prodName = productName || (req ? req.productName : 'Pastry');
    const prodId = productId || (req ? req.productId : '');
    const prodQty = Number(quantity) || (req ? req.requestedQuantity : 30);

    const recipe = this.getRecipeForProduct({ id: prodId, name: prodName });

    // 1. Transaction Safety: Check sufficiency
    if (recipe) {
      const check = this.checkIngredientsSufficiency(recipe, prodQty);
      if (!check.sufficient) {
        const shortageDesc = check.shortages
          .map(s => `${s.ingredientName}: required ${s.required} ${s.unit}, available ${s.available} ${s.unit} (shortage: ${s.shortage} ${s.unit})`)
          .join(', ');
        throw new Error(`Cannot complete production due to insufficient ingredients: ${shortageDesc}`);
      }
    }

    // 2. Generate batch number
    const batchNumber = `PR-${String(this.productionBatches.length + 1).padStart(3, '0')}`;
    const batchId = batchNumber;

    // 3. Deduct ingredients automatically
    const ingredientsUsed = [];
    if (recipe) {
      const requiredList = this.calculateRequiredIngredients(recipe, prodQty);
      for (const item of requiredList) {
        const ingIndex = this.ingredients.findIndex(i => i.id === item.ingredientId);
        if (ingIndex !== -1) {
          const currentIng = this.ingredients[ingIndex];
          const prevStock = currentIng.quantity;
          const newStock = Math.max(0, Math.round((prevStock - item.required) * 1000) / 1000);

          this.ingredients[ingIndex] = {
            ...currentIng,
            quantity: newStock,
            status: this.calculateIngredientStatus(newStock, currentIng.minimumStock, currentIng.disabled),
            updatedAt: new Date().toISOString()
          };

          ingredientsUsed.push({
            ingredientId: item.ingredientId,
            name: currentIng.name,
            quantity: item.required,
            unit: item.unit
          });

          // Log transaction for each ingredient used
          this.recordTransaction({
            type: 'Production Used',
            inventoryType: 'ingredient',
            itemId: currentIng.id,
            itemName: currentIng.name,
            quantityChange: -item.required,
            unit: item.unit,
            previousStock: prevStock,
            newStock,
            referenceId: batchNumber,
            reason: `Production #${batchNumber} (${prodQty} ${prodName})`,
            performedBy: bakerName,
            performedByRole: 'baker'
          });

          if (isFirebaseConfigured() && db) {
            updateDoc(doc(db, 'ingredients', currentIng.id), {
              quantity: newStock,
              status: this.ingredients[ingIndex].status,
              updatedAt: new Date().toISOString()
            }).catch(e => console.warn("Firestore completeProduction ing sync error:", e));
          }
        }
      }
      this.persistIngredients();
    }

    // 4. Create Production Batch (Status: Ready for Cashier)
    const newBatch = {
      id: batchId,
      batchNumber,
      requestId: req ? req.id : null,
      productId: String(prodId),
      productName: prodName,
      quantity: prodQty,
      recipeId: recipe ? recipe.id : null,
      ingredientsUsed,
      status: 'Ready for Cashier',
      producedBy: bakerName,
      producedByRole: 'baker',
      completedAt: new Date().toISOString(),
      receivedAt: null,
      receivedBy: null
    };

    this.productionBatches = [newBatch, ...this.productionBatches];
    this.persistProductionBatches();

    // 5. Update request status
    if (req) {
      this.updateProductionRequestStatus(req.id, 'Ready for Cashier');
    }

    // 6. Notify Cashier and Admin
    this.addNotification({
      type: 'ready_for_cashier',
      title: 'Pastries Ready to Receive',
      message: `${prodQty} ${prodName} baked and ready to receive into cashier stock. (Batch #${batchNumber})`,
      targetRole: 'cashier',
      referenceId: batchNumber
    });

    this.addNotification({
      type: 'admin_production_done',
      title: 'Production Completed',
      message: `Production completed: ${prodQty} ${prodName} by ${bakerName}.`,
      targetRole: 'admin',
      referenceId: batchNumber
    });

    if (isFirebaseConfigured() && db) {
      setDoc(doc(db, 'productionBatches', batchId), newBatch)
        .catch(e => console.warn("Firestore productionBatches sync error:", e));
    }

    this.notify();
    return newBatch;
  }

  /**
   * Section 13: Cashier receives produced pastries into finished-product inventory.
   * 1. Increases Cashier's finished-product stock.
   * 2. Marks batch as "Received".
   * 3. Marks associated request as "Received".
   * 4. Creates an inventory audit transaction (Production Received).
   */
  receiveProductionBatch(batchId, cashierName = 'Cashier Staff', shopManager = null) {
    const index = this.productionBatches.findIndex(b => b.id === batchId || b.batchNumber === batchId);
    if (index === -1) {
      throw new Error(`Production batch "${batchId}" not found.`);
    }

    const batch = this.productionBatches[index];
    if (batch.status === 'Received') {
      return batch; // Already received, guard against double-receiving!
    }

    // Increase finished-product inventory in ShopManager
    let prevStock = 0;
    let newStock = batch.quantity;

    if (shopManager) {
      // Find matching product in shopManager
      const prods = shopManager.getProducts();
      const product = prods.find(p => 
        String(p.id) === String(batch.productId) || 
        (p.name && p.name.toLowerCase() === batch.productName.toLowerCase())
      );

      if (product) {
        prevStock = Number(product.stock) || 0;
        newStock = prevStock + batch.quantity;
        shopManager.updateStock(product.id, newStock);
      }
    }

    // Update batch record
    const updatedBatch = {
      ...batch,
      status: 'Received',
      receivedAt: new Date().toISOString(),
      receivedBy: cashierName
    };
    this.productionBatches[index] = updatedBatch;
    this.persistProductionBatches();

    // Update production request if exists
    if (batch.requestId) {
      this.updateProductionRequestStatus(batch.requestId, 'Received');
    }

    // Record inventory transaction
    this.recordTransaction({
      type: 'Production Received',
      inventoryType: 'finished_product',
      itemId: batch.productId,
      itemName: batch.productName,
      quantityChange: batch.quantity,
      unit: 'pcs',
      previousStock: prevStock,
      newStock: newStock,
      referenceId: batch.batchNumber,
      reason: `Production #${batch.batchNumber} Received`,
      performedBy: cashierName,
      performedByRole: 'cashier'
    });

    if (isFirebaseConfigured() && db) {
      updateDoc(doc(db, 'productionBatches', batch.id), {
        status: 'Received',
        receivedAt: updatedBatch.receivedAt,
        receivedBy: cashierName
      }).catch(e => console.warn("Firestore receiveProductionBatch error:", e));
    }

    this.notify();
    return updatedBatch;
  }

  // ==========================================
  // CUSTOMER SALE INVENTORY DEDUCTION
  // ==========================================
  /**
   * Logs inventory transaction when cashier sells pastries,
   * and automatically checks if finished-product stock dropped below minimum.
   */
  recordCustomerSale(sale, cashierName = 'Cashier Staff', allProducts = []) {
    if (!sale || !sale.items) return;

    sale.items.forEach(item => {
      const prod = allProducts.find(p => String(p.id) === String(item.id) || p.name === item.name);
      const currentStock = prod ? prod.stock : 0;
      const prevStock = currentStock + item.quantity;

      this.recordTransaction({
        type: 'Customer Sale',
        inventoryType: 'finished_product',
        itemId: item.id,
        itemName: item.name,
        quantityChange: -item.quantity,
        unit: 'pcs',
        previousStock: prevStock,
        newStock: currentStock,
        referenceId: sale.id || `ORD-${sale.saleNumber}`,
        reason: `Customer Sale #${sale.saleNumber || sale.id}`,
        performedBy: cashierName,
        performedByRole: 'cashier'
      });

      // Check if this product is now below minimum stock
      if (prod && prod.stock <= (prod.minimumStock || 20)) {
        this.createProductionRequest({
          productId: prod.id,
          productName: prod.name,
          requestedQuantity: prod.productionBatchSize || 30,
          currentStock: prod.stock,
          minimumStock: prod.minimumStock || 20,
          priority: prod.stock === 0 ? 'Urgent' : 'High',
          triggeredBy: 'Low Stock Automation'
        });
      }
    });

    this.notify();
  }

  // ==========================================
  // INVENTORY TRANSACTIONS AUDIT TRAIL
  // ==========================================
  getInventoryTransactions() {
    return [...this.inventoryTransactions];
  }

  recordTransaction(txData) {
    const nextNumber = this.inventoryTransactions.length + 1;
    const id = `TX-${String(nextNumber).padStart(4, '0')}`;

    const newTx = {
      id,
      type: txData.type || 'Manual Adjustment',
      inventoryType: txData.inventoryType || 'ingredient',
      itemId: String(txData.itemId),
      itemName: txData.itemName,
      quantityChange: Number(txData.quantityChange),
      unit: txData.unit || 'pcs',
      previousStock: Number(txData.previousStock) || 0,
      newStock: Number(txData.newStock) || 0,
      referenceId: txData.referenceId || 'N/A',
      reason: txData.reason || '',
      performedBy: txData.performedBy || 'System',
      performedByRole: txData.performedByRole || 'system',
      timestamp: new Date().toISOString()
    };

    this.inventoryTransactions = [newTx, ...this.inventoryTransactions];
    this.persistTransactions();

    if (isFirebaseConfigured() && db) {
      addDoc(collection(db, 'inventoryTransactions'), newTx)
        .catch(err => console.warn("Firestore recordTransaction error:", err));
    }

    return newTx;
  }

  // ==========================================
  // NOTIFICATIONS SYSTEM
  // ==========================================
  getNotifications(role = null) {
    if (!role) return [...this.notifications];
    return this.notifications.filter(n => !n.targetRole || n.targetRole === role || n.targetRole === 'all');
  }

  addNotification({ type, title, message, targetRole = 'all', referenceId = null }) {
    const note = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      title,
      message,
      targetRole,
      referenceId,
      read: false,
      timestamp: new Date().toISOString()
    };

    this.notifications = [note, ...this.notifications.slice(0, 49)]; // keep latest 50
    this.persistNotifications();
    this.notify();
    return note;
  }

  markNotificationAsRead(id) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.persistNotifications();
    this.notify();
  }

  clearNotifications() {
    this.notifications = [];
    this.persistNotifications();
    this.notify();
  }
}

export default BakeryWorkflowManager;
