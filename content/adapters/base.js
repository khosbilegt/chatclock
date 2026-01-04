// content/adapters/base.js

/**
 * Base adapter interface for website-specific logic
 * Each website adapter must implement these methods
 */
function WebsiteAdapter() {}

WebsiteAdapter.prototype = {
  /**
   * Check if the current page is supported by this adapter
   * @returns {boolean}
   */
  isSupported() {
    throw new Error("isSupported() must be implemented");
  },

  /**
   * Extract the conversation/thread identifier from the current URL
   * @returns {string|null} The identifier, or null if not found
   */
  getThreadId() {
    throw new Error("getThreadId() must be implemented");
  },

  /**
   * Get the hostname pattern(s) this adapter supports
   * @returns {string|string[]} Hostname(s) or pattern(s)
   */
  getHostname() {
    throw new Error("getHostname() must be implemented");
  },

  /**
   * Get the name of the website
   * @returns {string}
   */
  getName() {
    throw new Error("getName() must be implemented");
  },
};

// Export for use in other files
if (typeof window !== "undefined") {
  window.WebsiteAdapter = WebsiteAdapter;
}
