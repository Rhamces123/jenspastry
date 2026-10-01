// ==========================================
// Jen's Pastry Shop - Factory Pattern
// ==========================================

// VARIABLES
export const PRODUCT_CATEGORIES = ['Bread', 'Pastry', 'Cake', 'Dessert'];

// OBJECTS & CLASSES

/**
 * Base Product representation
 */
class BaseProduct {
  constructor({ id, name, category, price, stock, icon, shelfLifeDays }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.price = Number(price);
    this.stock = Number(stock);
    this.icon = icon || '🥐';
    this.shelfLifeDays = shelfLifeDays || 3;
    this.createdAt = new Date().toISOString();
  }

  // OBJECT METHOD: Check stock status
  getStatus() {
    if (this.stock === 0) return 'Out of Stock';
    if (this.stock <= 10) return 'Low Stock';
    return 'In Stock';
  }
}

class BreadProduct extends BaseProduct {
  constructor(data) {
    super({
      ...data,
      category: 'Bread',
      icon: '🥖',
      shelfLifeDays: 2
    });
  }
}

class PastryProductItem extends BaseProduct {
  constructor(data) {
    super({
      ...data,
      category: 'Pastry',
      icon: '🥐',
      shelfLifeDays: 3
    });
  }
}

class CakeProduct extends BaseProduct {
  constructor(data) {
    super({
      ...data,
      category: 'Cake',
      icon: '🎂',
      shelfLifeDays: 5
    });
  }
}

class DessertProduct extends BaseProduct {
  constructor(data) {
    super({
      ...data,
      category: 'Dessert',
      icon: '🍮',
      shelfLifeDays: 4
    });
  }
}

// FACTORY PATTERN
// Creates pastry product objects in one centralized place.
// This decouples the client code (React components) from product instantiation logic.
export class PastryProductFactory {
  /**
   * Central factory method to instantiate pastry products by category.
   * 
   * @param {Object} productData - { id, name, category, price, stock }
   * @returns {BaseProduct} Newly created product instance
   */
  static createProduct(productData) {
    if (!productData) {
      throw new Error("Product data is required to create a product.");
    }

    const { id, name, category, price, stock } = productData;

    // Validate product name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error("Product name is required.");
    }

    // Validate price
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw new Error("Price must be a valid positive number.");
    }

    // Validate stock
    const parsedStock = Number(stock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      throw new Error("Stock must be a valid non-negative number.");
    }

    // Normalize category string
    const normalizedCategory = category ? category.trim() : 'Pastry';

    // Normalize payload
    const payload = {
      id: id || Date.now(),
      name: name.trim(),
      category: normalizedCategory,
      price: parsedPrice,
      stock: parsedStock
    };

    // Instantiate appropriate product subclass based on category
    switch (normalizedCategory) {
      case 'Bread':
        return new BreadProduct(payload);
      case 'Cake':
        return new CakeProduct(payload);
      case 'Dessert':
        return new DessertProduct(payload);
      case 'Pastry':
      default:
        return new PastryProductItem(payload);
    }
  }
}
