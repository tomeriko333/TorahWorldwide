const KEYS = {
  BOOKMARKS: 'torah-reader-bookmarks',
  SETTINGS: 'torah-reader-settings',
  XP: 'torah-reader-xp',
  LAST_POSITION: 'torah-reader-last-position',
  STREAK: 'torah-reader-streak',
};

export function getItem(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

export function getSettings() {
  return getItem(KEYS.SETTINGS) || {
    fontSize: 28,
    speed: 80,
    darkMode: true,
    musicVolume: 0.3,
    textPadding: 50,
    hebrewNumerals: false,
    showAllText: false,
  };
}

export function saveSettings(settings) {
  setItem(KEYS.SETTINGS, settings);
}

export function getLastPosition() {
  return getItem(KEYS.LAST_POSITION);
}

export function saveLastPosition(position) {
  setItem(KEYS.LAST_POSITION, position);
}

export function getBookmarks() {
  return getItem(KEYS.BOOKMARKS) || [];
}

export function saveBookmark(bookmark) {
  const bookmarks = getBookmarks();
  bookmarks.push({ ...bookmark, timestamp: Date.now() });
  setItem(KEYS.BOOKMARKS, bookmarks);
}

export function removeBookmark(index) {
  const bookmarks = getBookmarks();
  bookmarks.splice(index, 1);
  setItem(KEYS.BOOKMARKS, bookmarks);
}

export { KEYS };
