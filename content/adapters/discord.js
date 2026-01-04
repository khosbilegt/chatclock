// content/adapters/discord.js

/**
 * Discord-specific adapter
 */
function DiscordAdapter() {
  WebsiteAdapter.call(this);
}

DiscordAdapter.prototype = Object.create(WebsiteAdapter.prototype);
DiscordAdapter.prototype.constructor = DiscordAdapter;

DiscordAdapter.prototype.getName = function () {
  return "Discord";
};

DiscordAdapter.prototype.getHostname = function () {
  return "discord.com";
};

DiscordAdapter.prototype.isSupported = function () {
  return window.location.hostname === this.getHostname();
};

DiscordAdapter.prototype.getThreadId = function () {
  // Extract channel ID from Discord DM URL: /channels/@me/1406480681168797810
  const match = window.location.pathname.match(/\/channels\/@me\/(\d+)/);
  return match ? match[1] : null;
};

// Export for use in other files
if (typeof window !== "undefined") {
  window.DiscordAdapter = DiscordAdapter;
}
