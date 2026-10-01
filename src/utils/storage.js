// ==========================================
// Jen's Pastry Shop - Storage Utility
// Manages browser LocalStorage persistence
// ==========================================

// VARIABLES
const STORAGE_KEYS = {
  PRODUCTS: 'jens_pastry_products_v1',
  SALES: 'jens_pastry_sales_v1',
  SETTINGS: 'jens_pastry_settings_v1'
};

// FUNCTIONS

/**
 * Saves the products array to browser LocalStorage.
 * @param {Array} products - Array of product objects
 */
export function saveProducts(products) {
  try {
    const serialized = JSON.stringify(products);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, serialized);
    return true;
  } catch (error) {
    console.error("Error saving products to LocalStorage:", error);
    return false;
  }
}

/**
 * Loads products from browser LocalStorage.
 * Returns null if no data exists.
 * @returns {Array|null}
 */
export function loadProducts() {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!serialized) return null;
    return JSON.parse(serialized);
  } catch (error) {
    console.error("Error loading products from LocalStorage:", error);
    return null;
  }
}

/**
 * Saves the sales history array to browser LocalStorage.
 * @param {Array} sales - Array of sale records
 */
export function saveSales(sales) {
  try {
    const serialized = JSON.stringify(sales);
    localStorage.setItem(STORAGE_KEYS.SALES, serialized);
    return true;
  } catch (error) {
    console.error("Error saving sales to LocalStorage:", error);
    return false;
  }
}

/**
 * Loads sales history from browser LocalStorage.
 * Returns empty array if none exists.
 * @returns {Array}
 */
export function loadSales() {
  try {
    const serialized = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!serialized) return [];
    return JSON.parse(serialized);
  } catch (error) {
    console.error("Error loading sales from LocalStorage:", error);
    return [];
  }
}

/**
 * Clears all pastry shop data from LocalStorage (useful for reset/demo).
 */
export function clearAllStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    return true;
  } catch (error) {
    console.error("Error clearing LocalStorage:", error);
    return false;
  }
}
