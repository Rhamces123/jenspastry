// ==========================================
// BAKEOLOGY - PWA Installation Utilities
// Detects standalone display mode and installation state
// ==========================================

export const PWA_INSTALLED_KEY = 'bakeology_pwa_installed';

/**
 * Checks if the app is currently running inside an installed standalone window.
 * Supports Chrome/Edge Desktop PWA, Android WebAPK/PWA, iOS Home Screen PWA.
 * @returns {boolean}
 */
export function isStandaloneMode() {
  if (typeof window === 'undefined') return false;

  const isStandaloneMedia = window.matchMedia?.('(display-mode: standalone)')?.matches;
  const isFullscreenMedia = window.matchMedia?.('(display-mode: fullscreen)')?.matches;
  const isMinimalUiMedia = window.matchMedia?.('(display-mode: minimal-ui)')?.matches;
  const isOverlayMedia = window.matchMedia?.('(display-mode: window-controls-overlay)')?.matches;
  const isIOSStandalone = window.navigator?.standalone === true;
  const isAndroidTWA = typeof document !== 'undefined' && document.referrer?.includes('android-app://');

  return Boolean(
    isStandaloneMedia ||
    isFullscreenMedia ||
    isMinimalUiMedia ||
    isOverlayMedia ||
    isIOSStandalone ||
    isAndroidTWA
  );
}

/**
 * Checks if the app is installed, either currently running standalone
 * or previously recorded as installed.
 * @returns {boolean}
 */
export function checkIsAppInstalled() {
  if (isStandaloneMode()) return true;

  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(PWA_INSTALLED_KEY) === 'true';
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Persists the installed status in localStorage.
 */
export function markAppAsInstalled() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PWA_INSTALLED_KEY, 'true');
    }
  } catch (err) {
    console.warn('Could not persist PWA install state:', err);
  }
}

/**
 * Clears the installed status in localStorage.
 */
export function clearAppInstalledState() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(PWA_INSTALLED_KEY);
    }
  } catch (err) {
    console.warn('Could not clear PWA install state:', err);
  }
}
