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
});
