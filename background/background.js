// background/background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_TIMEZONE") {
    const key = `timezone_${request.threadId}`;
    chrome.storage.local.get([key], (result) => {
      sendResponse({ timezone: result[key] || null });
    });
    return true; // Keep channel open for async response
  }

  if (request.type === "SET_TIMEZONE") {
    const key = `timezone_${request.threadId}`;
    chrome.storage.local.set({ [key]: request.timezone }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.type === "GET_POSITION") {
    chrome.storage.local.get(["badge_position"], (result) => {
      sendResponse({ position: result.badge_position || "bottom-right" });
    });
    return true;
  }

  if (request.type === "SET_POSITION") {
    chrome.storage.local.set({ badge_position: request.position }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
