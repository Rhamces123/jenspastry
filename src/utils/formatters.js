// ==========================================
// Jen's Pastry Shop - Formatting Utilities
// ==========================================

// FUNCTIONS

/**
 * Format a number as Philippine Peso currency (₱).
 * @param {number} amount
 * @param {boolean} includeDecimals - whether to show .00 or not
 * @returns {string} e.g. "₱450" or "₱450.50"
 */
export function formatCurrency(amount, includeDecimals = false) {
  const numericAmount = Number(amount) || 0;
  if (includeDecimals || numericAmount % 1 !== 0) {
    return `₱${numericAmount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  return `₱${numericAmount.toLocaleString('en-PH')}`;
}

/**
 * Format a sale sequential number into "Sale #001" style.
 * @param {number|string} id - The sequential number or id
 * @returns {string} e.g. "Sale #001"
 */
export function formatSaleNumber(id) {
  if (typeof id === 'string' && id.startsWith('Sale #')) {
    return id;
  }
  const cleanNum = String(id).replace(/\D/g, '') || '1';
  return `Sale #${cleanNum.padStart(3, '0')}`;
}

/**
 * Formats an ISO date string or timestamp into a readable mobile date/time.
 * @param {string|Date} dateInput
 * @returns {string} e.g. "Oct 1, 2026 • 2:45 PM"
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
