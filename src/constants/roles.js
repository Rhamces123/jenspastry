// ==========================================
// Jen's Pastry Shop - Role-Based Access Control (RBAC) Constants
// Exact roles: customer, cashier, baker, admin
// ==========================================

export const ROLES = {
  CUSTOMER: 'customer',
  CASHIER: 'cashier',
  BAKER: 'baker',
  ADMIN: 'admin'
};

export const ROLE_LABELS = {
  [ROLES.CUSTOMER]: 'Customer',
  [ROLES.CASHIER]: 'Cashier',
  [ROLES.BAKER]: 'Baker',
  [ROLES.ADMIN]: 'Store Owner / Admin'
};

export const ROLE_DASHBOARDS = {
  [ROLES.CUSTOMER]: '/customer/dashboard',
  [ROLES.CASHIER]: '/cashier/dashboard',
  [ROLES.BAKER]: '/baker/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard'
};

/**
 * Returns the designated dashboard path for a given role, falling back to customer dashboard.
 * @param {string} role 
 * @returns {string}
 */
export function getDashboardPathForRole(role) {
  return ROLE_DASHBOARDS[role] || ROLE_DASHBOARDS[ROLES.CUSTOMER];
}

/**
 * Role Permission Matrix
 * Feature             Customer  Cashier  Baker  Admin
 * Browse Products     YES       YES      YES    YES
 * Place Cust Order    YES       YES      NO     YES
 * My Orders           YES       NO       NO     YES
 * POS                 NO        YES      NO     YES
 * Payments            NO        YES      NO     YES
 * Production Queue    NO        NO       YES    YES
 * Inventory           NO        Limited  View   YES
 * Product Management  NO        NO       NO     YES
 * User Management     NO        NO       NO     YES
 * Sales Reports       NO        Shift    NO     YES
 * System Settings     NO        NO       NO     YES
 */
export const PERMISSIONS = {
  BROWSE_PRODUCTS: 'BROWSE_PRODUCTS',
  PLACE_ORDER: 'PLACE_ORDER',
  VIEW_MY_ORDERS: 'VIEW_MY_ORDERS',
  POS: 'POS',
  PROCESS_PAYMENTS: 'PROCESS_PAYMENTS',
  PRODUCTION_QUEUE: 'PRODUCTION_QUEUE',
  INVENTORY_VIEW: 'INVENTORY_VIEW',
  INVENTORY_MANAGE: 'INVENTORY_MANAGE',
  PRODUCT_MANAGEMENT: 'PRODUCT_MANAGEMENT',
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  SALES_REPORTS_SHIFT: 'SALES_REPORTS_SHIFT',
  SALES_REPORTS_FULL: 'SALES_REPORTS_FULL',
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS'
};

const ROLE_PERMISSIONS = {
  [ROLES.CUSTOMER]: [
    PERMISSIONS.BROWSE_PRODUCTS,
    PERMISSIONS.PLACE_ORDER,
    PERMISSIONS.VIEW_MY_ORDERS
  ],
  [ROLES.CASHIER]: [
    PERMISSIONS.BROWSE_PRODUCTS,
    PERMISSIONS.PLACE_ORDER,
    PERMISSIONS.POS,
    PERMISSIONS.PROCESS_PAYMENTS,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.SALES_REPORTS_SHIFT
  ],
  [ROLES.BAKER]: [
    PERMISSIONS.BROWSE_PRODUCTS,
    PERMISSIONS.PRODUCTION_QUEUE,
    PERMISSIONS.INVENTORY_VIEW
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.BROWSE_PRODUCTS,
    PERMISSIONS.PLACE_ORDER,
    PERMISSIONS.VIEW_MY_ORDERS,
    PERMISSIONS.POS,
    PERMISSIONS.PROCESS_PAYMENTS,
    PERMISSIONS.PRODUCTION_QUEUE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.PRODUCT_MANAGEMENT,
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.SALES_REPORTS_SHIFT,
    PERMISSIONS.SALES_REPORTS_FULL,
    PERMISSIONS.SYSTEM_SETTINGS
  ]
};

/**
 * Validates whether a user role has access to a specific system permission.
 * @param {string} role 
 * @param {string} permission 
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export const OFFICIAL_STAFF_EMAILS = {
  'admin@jenspastry.com': ROLES.ADMIN,
  'cashier@jenspastry.com': ROLES.CASHIER,
  'baker@jenspastry.com': ROLES.BAKER
};

/**
 * Resolves the authoritative role for a given user based on their email, display name, and stored role.
 * Ensures admin and staff accounts are properly recognized and never misclassified as customer.
 * 
 * @param {string} [email]
 * @param {string} [fullName]
 * @param {string|null} [existingRole]
 * @returns {string} One of ROLES (ADMIN, CASHIER, BAKER, CUSTOMER)
 */
export function resolveRoleForUser(email = '', fullName = '', existingRole = null) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (fullName || '').trim().toLowerCase();

  // 1. Exact match with official bakery staff email
  if (OFFICIAL_STAFF_EMAILS[cleanEmail]) {
    return OFFICIAL_STAFF_EMAILS[cleanEmail];
  }

  // 2. Admin heuristics
  const nameParts = cleanName.split(/\s+/);
  const emailPrefix = cleanEmail.split('@')[0];
  if (
    cleanEmail.startsWith('admin@') ||
    cleanEmail.endsWith('@admin.jenspastry.com') ||
    cleanEmail === 'admin' ||
    emailPrefix === 'admin' ||
    nameParts.includes('admin') ||
    nameParts.includes('administrator') ||
    cleanName.includes('store owner') ||
    existingRole === ROLES.ADMIN
  ) {
    return ROLES.ADMIN;
  }

  // 3. Cashier heuristics
  if (
    cleanEmail.startsWith('cashier@') ||
    emailPrefix === 'cashier' ||
    nameParts.includes('cashier') ||
    existingRole === ROLES.CASHIER
  ) {
    return ROLES.CASHIER;
  }

  // 4. Baker heuristics
  if (
    cleanEmail.startsWith('baker@') ||
    emailPrefix === 'baker' ||
    nameParts.includes('baker') ||
    existingRole === ROLES.BAKER
  ) {
    return ROLES.BAKER;
  }

  // 5. Existing valid role if already assigned
  if (existingRole && Object.values(ROLES).includes(existingRole)) {
    return existingRole;
  }

  return ROLES.CUSTOMER;
}
