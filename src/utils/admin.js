// Admin gate — locks expensive / destructive features (Claude translation,
// sync-timing edits, translation edits) so only the site owner can use them.
//
// How to unlock:
//   1. Visit the site with ?admin=<ADMIN_KEY> in the URL once.
//      The key is saved to localStorage and the query param is stripped.
//      The site then remembers you as admin on this browser forever (until
//      localStorage is cleared).
//   2. To lock back: visit ?admin=off (clears the flag).
//
// The admin key can be overridden per-environment by setting
// VITE_ADMIN_KEY in Vercel / .env.local. Default below is used otherwise.
//
// NOTE: This is not cryptographic security — the key ends up in the built
// JS bundle. It only stops casual abuse. Real security for API endpoints
// belongs on the server side (check a secret before running Claude etc.).

const ADMIN_STORAGE_KEY = 'torah-admin';
const DEFAULT_ADMIN_KEY = 'tomer-torah-master';
const ADMIN_KEY = (import.meta.env && import.meta.env.VITE_ADMIN_KEY) || DEFAULT_ADMIN_KEY;

// Auto-unlock on page load from ?admin=<key>
if (typeof window !== 'undefined') {
  try {
    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get('admin');
    if (paramValue) {
      if (paramValue === 'off') {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
      } else if (paramValue === ADMIN_KEY) {
        localStorage.setItem(ADMIN_STORAGE_KEY, 'yes');
      }
      // Strip the ?admin param from the URL either way so it's not visible
      params.delete('admin');
      const qs = params.toString();
      const newUrl =
        window.location.pathname +
        (qs ? '?' + qs : '') +
        window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  } catch {
    // localStorage or URL API unavailable — silently skip
  }
}

export function isAdmin() {
  try {
    return typeof window !== 'undefined' && localStorage.getItem(ADMIN_STORAGE_KEY) === 'yes';
  } catch {
    return false;
  }
}

// Convenience for the console: window.unlockAdmin('<key>')
if (typeof window !== 'undefined') {
  window.unlockAdmin = (key) => {
    if (key === ADMIN_KEY) {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'yes');
      console.log('✓ Admin unlocked. Reload to activate features.');
      return true;
    }
    console.warn('✗ Wrong admin key.');
    return false;
  };
  window.lockAdmin = () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    console.log('Admin locked. Reload to hide features.');
  };
}
