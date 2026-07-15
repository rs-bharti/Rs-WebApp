// Opens a route in a new tab while preserving the auth session.

// AuthContext clears sessionStorage for "fresh" tabs but treats _willReload
// tabs as page refreshes (restored session). window.open copies sessionStorage
// from parent to child, so setting the flag here makes the new tab inherit it.
export const openInTab = (path) => {
  sessionStorage.setItem('_willReload', '1');
  window.open(path, '_blank');
};
