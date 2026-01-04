// content/adapters/instagram.js

/**
 * Instagram-specific adapter
 */
function InstagramAdapter() {
  WebsiteAdapter.call(this);
}

InstagramAdapter.prototype = Object.create(WebsiteAdapter.prototype);
InstagramAdapter.prototype.constructor = InstagramAdapter;

InstagramAdapter.prototype.getName = function () {
  return "Instagram";
};

InstagramAdapter.prototype.getHostname = function () {
  return "www.instagram.com";
};

InstagramAdapter.prototype.isSupported = function () {
  return window.location.hostname === this.getHostname();
};

InstagramAdapter.prototype.getThreadId = function () {
  // Extract thread ID from Instagram DM URL: /direct/t/123456789/
  const match = window.location.pathname.match(/\/direct\/t\/(\d+)/);
  return match ? match[1] : null;
};

// Export for use in other files
if (typeof window !== "undefined") {
  window.InstagramAdapter = InstagramAdapter;
}
