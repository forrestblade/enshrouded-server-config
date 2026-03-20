// String catalog — all user-facing text in one place for future i18n
const strings = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    loading: 'Loading\u2026',
    saving: 'Saving\u2026',
    deleting: 'Deleting\u2026',
    export: 'Export JSON',
    clone: 'Clone Config',
    back: 'Back',
    goHome: 'Go Home',
  },
  editor: {
    saved: 'Config saved.',
    saveFailed: 'Failed to save config.',
    resetConfirm: 'Reset all settings to defaults?',
    exportFilename: 'enshrouded_server.json',
    addGroup: '+ Add Group',
    sharePublicly: 'Share Publicly',
    resetDefaults: 'Reset Defaults',
    draftRestored: 'Draft restored',
    draftSaved: 'Draft saved',
    resetToDefaults: 'Reset to defaults',
    jsonExported: 'JSON exported',
  },
  browse: {
    searchPlaceholder: 'Search configs\u2026',
    noResults: 'No configs found.',
    featured: 'Featured',
    allShared: 'All Shared Configs',
    sortNewest: 'Newest',
    sortMostLiked: 'Most Liked',
    fork: '{count} fork',
    forks: '{count} forks',
    loginToLike: 'Log in to like configs',
    failedToLike: 'Failed to like',
    failedToClone: 'Failed to clone config',
  },
  account: {
    saved: 'Changes saved.',
    saveFailed: 'Failed to save.',
    deleteTitle: 'Delete Account?',
    deleteWarning: 'This cannot be undone. Your configs will remain but lose ownership.',
    deleteFailed: 'Failed to delete account.',
  },
  auth: {
    loginFailed: 'Invalid email or password.',
    signupFailed: 'Registration failed.',
    passwordMin: 'Password must be at least 8 characters.',
  },
  errors: {
    notFound: 'Config not found.',
    serverError: 'Something went wrong. Please try again.',
    notAuthenticated: 'Please log in to continue.',
  },
  profile: {
    joined: 'Joined {date}',
    publishedConfigs: 'Published Configs',
    noConfigs: 'No published configs yet.',
  },
}

/**
 * Look up a translation key with optional interpolation.
 * @param {string} key - Dot-separated key like 'editor.saved'
 * @param {Record<string, string|number>} [params] - Interpolation values
 * @returns {string}
 */
export function t(key, params) {
  const parts = key.split('.')
  let val = strings
  for (const p of parts) {
    val = val?.[p]
    if (val === undefined) return key // fallback to key itself
  }
  if (typeof val !== 'string') return key
  if (!params) return val
  return val.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? _)
}

export { strings }
