// ==========================================
// Jen's Pastry Shop - Strategy Pattern
// Manages customer discount algorithms
// ==========================================

// VARIABLES
export const STRATEGY_TYPES = {
  REGULAR: 'regular',
  STUDENT: 'student',
  BULK: 'bulk'
};

// STRATEGY PATTERN
// Allows different discount methods to be selected during checkout.
// Each strategy encapsulates a specific discount algorithm without messy if/else blocks.

/**
 * Base Discount Strategy interface/superclass.
 */
class BaseDiscountStrategy {
  constructor(id, name, customerLabel, rate, description) {
    // OBJECTS: Strategy metadata
    this.id = id;
    this.name = name;
    this.customerLabel = customerLabel;
    this.rate = rate; // Decimal percentage (e.g., 0.05 for 5%)
    this.description = description;
  }

  /**
   * Calculates discount amount based on subtotal.
   * @param {number} _subtotal
   * @returns {number} discount amount in Pesos
   */
  calculateDiscount(_subtotal) {
    return 0;
  }
}

/**
 * Regular Customer Discount Strategy: 0% discount.
 */
export class RegularDiscountStrategy extends BaseDiscountStrategy {
  constructor() {
    super(
      STRATEGY_TYPES.REGULAR,
      'Regular Discount (0%)',
      'Regular Customer',
      0.0,
      'Standard retail rate with no discount.'
    );
  }

  // FUNCTIONS: Strategy execution
  calculateDiscount(_subtotal) {
    // 0% discount
    return 0;
  }
}

/**
 * Student Customer Discount Strategy: 5% discount.
 */
export class StudentDiscountStrategy extends BaseDiscountStrategy {
  constructor() {
    super(
      STRATEGY_TYPES.STUDENT,
      'Student Discount (5%)',
      'Student Customer',
      0.05,
      'Special 5% discount for verified students.'
    );
  }

  // FUNCTIONS: Strategy execution
  calculateDiscount(subtotal) {
    if (!subtotal || subtotal <= 0) return 0;
    // 5% discount rounded to 2 decimal places
    const discount = subtotal * this.rate;
    return Math.round(discount * 100) / 100;
  }
}

/**
 * Bulk Order Discount Strategy: 10% discount.
 */
export class BulkOrderDiscountStrategy extends BaseDiscountStrategy {
  constructor() {
    super(
      STRATEGY_TYPES.BULK,
      'Bulk Order Discount (10%)',
      'Bulk Order',
      0.10,
      'Special 10% discount for large party/wholesale orders.'
    );
  }

  // FUNCTIONS: Strategy execution
  calculateDiscount(subtotal) {
    if (!subtotal || subtotal <= 0) return 0;
    // 10% discount rounded to 2 decimal places
    const discount = subtotal * this.rate;
    return Math.round(discount * 100) / 100;
  }
}

// ARRAYS: Pre-instantiated strategies registry for UI selectors
export const AVAILABLE_STRATEGIES = [
  new RegularDiscountStrategy(),
  new StudentDiscountStrategy(),
  new BulkOrderDiscountStrategy()
];

// FUNCTIONS: Strategy context helper to retrieve strategy by ID
export function getDiscountStrategy(strategyId) {
  const found = AVAILABLE_STRATEGIES.find(strategy => strategy.id === strategyId);
  return found || AVAILABLE_STRATEGIES[0]; // Defaults to Regular (0%)
}
