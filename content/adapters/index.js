// content/adapters/index.js

/**
 * Array of all available website adapters
 * Add new adapters here as they are created
 */
const adapters = [];

/**
 * Initialize adapters (called after adapter classes are loaded)
 */
function initializeAdapters() {
  if (typeof InstagramAdapter !== "undefined") {
    adapters.push(new InstagramAdapter());
  }
  if (typeof DiscordAdapter !== "undefined") {
    adapters.push(new DiscordAdapter());
  }
  // Add more adapters here as they are created
  // if (typeof TwitterAdapter !== "undefined") {
  //   adapters.push(new TwitterAdapter());
  // }
}

/**
 * Get the appropriate adapter for the current website
 * @returns {WebsiteAdapter|null} The matching adapter, or null if none match
 */
function getAdapter() {
  // Initialize adapters if not already done
  if (adapters.length === 0) {
    initializeAdapters();
  }

  for (const adapter of adapters) {
    if (adapter.isSupported()) {
      return adapter;
    }
  }
  return null;
}

/**
 * Get all available adapters
 * @returns {WebsiteAdapter[]}
 */
function getAllAdapters() {
  if (adapters.length === 0) {
    initializeAdapters();
  }
  return adapters;
}

// Export for use in other files
if (typeof window !== "undefined") {
  window.AdapterRegistry = {
    getAdapter,
    getAllAdapters,
  };
}
