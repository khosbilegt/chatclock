// content/contentScript.js

let currentThreadId = null;
let badgeEl = null;
let popoverEl = null;
let timeUpdateInterval = null;
let currentAdapter = null;
let badgePosition = "bottom-right";

/* -----------------------------
   Website adapter
------------------------------ */

function getAdapter() {
  if (!currentAdapter && typeof AdapterRegistry !== "undefined") {
    currentAdapter = AdapterRegistry.getAdapter();
  }
  return currentAdapter;
}

function isValidWebsite() {
  const adapter = getAdapter();
  return adapter !== null && adapter.isSupported();
}

function getThreadId() {
  const adapter = getAdapter();
  if (!adapter) return null;
  return adapter.getThreadId();
}

/* -----------------------------
   UI helpers
------------------------------ */

function applyBadgePosition() {
  if (!badgeEl) return;

  // Reset all position properties
  badgeEl.style.top = "";
  badgeEl.style.bottom = "";
  badgeEl.style.left = "";
  badgeEl.style.right = "";

  switch (badgePosition) {
    case "top-right":
      badgeEl.style.top = "20px";
      badgeEl.style.right = "20px";
      break;
    case "top-left":
      badgeEl.style.top = "20px";
      badgeEl.style.left = "20px";
      break;
    case "bottom-left":
      badgeEl.style.bottom = "20px";
      badgeEl.style.left = "20px";
      break;
    case "bottom-right":
    default:
      badgeEl.style.bottom = "20px";
      badgeEl.style.right = "20px";
      break;
  }
}

function applyPopoverPosition() {
  if (!popoverEl || !badgeEl) return;

  // Reset all position properties
  popoverEl.style.top = "";
  popoverEl.style.bottom = "";
  popoverEl.style.left = "";
  popoverEl.style.right = "";

  const badgeRect = badgeEl.getBoundingClientRect();
  const popoverHeight = 300; // Approximate popover height
  const popoverWidth = 280; // Popover width
  const spacing = 10; // Space between badge and popover

  switch (badgePosition) {
    case "top-right":
      popoverEl.style.top = `${badgeRect.bottom + spacing}px`;
      popoverEl.style.right = "20px";
      break;
    case "top-left":
      popoverEl.style.top = `${badgeRect.bottom + spacing}px`;
      popoverEl.style.left = "20px";
      break;
    case "bottom-left":
      popoverEl.style.bottom = `${
        window.innerHeight - badgeRect.top + spacing
      }px`;
      popoverEl.style.left = "20px";
      break;
    case "bottom-right":
    default:
      popoverEl.style.bottom = `${
        window.innerHeight - badgeRect.top + spacing
      }px`;
      popoverEl.style.right = "20px";
      break;
  }
}

function createBadge() {
  if (badgeEl) return badgeEl;

  badgeEl = document.createElement("div");
  badgeEl.id = "chatclock-time-badge";

  badgeEl.style.cssText = `
    position: fixed;
    background: rgba(0, 0, 0, 0.9);
    color: #fff;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    z-index: 999999;
    cursor: pointer;
    user-select: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
    min-width: 120px;
    text-align: center;
  `;

  applyBadgePosition();

  badgeEl.addEventListener("mouseenter", () => {
    if (badgeEl) {
      badgeEl.style.background = "rgba(0, 0, 0, 0.95)";
      badgeEl.style.transform = "scale(1.02)";
    }
  });

  badgeEl.addEventListener("mouseleave", () => {
    if (badgeEl) {
      badgeEl.style.background = "rgba(0, 0, 0, 0.9)";
      badgeEl.style.transform = "scale(1)";
    }
  });

  badgeEl.addEventListener("click", () => {
    if (isValidWebsite() && currentThreadId) {
      togglePopover();
    }
  });

  badgeEl.textContent = "—";
  document.body.appendChild(badgeEl);
  return badgeEl;
}

function removeBadge() {
  if (badgeEl) {
    badgeEl.remove();
    badgeEl = null;
  }
  if (popoverEl) {
    popoverEl.remove();
    popoverEl = null;
  }
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
}

function updateBadge(text) {
  const badge = createBadge();
  badge.textContent = text;
}

/* -----------------------------
   Popover UI
------------------------------ */

function createPopover() {
  if (popoverEl) return popoverEl;

  popoverEl = document.createElement("div");
  popoverEl.id = "chatclock-popover";
  popoverEl.style.cssText = `
    position: fixed;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    padding: 20px;
    z-index: 1000000;
    min-width: 280px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: none;
  `;

  applyPopoverPosition();

  popoverEl.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #262626;">Set Timezone</h3>
      <p style="margin: 0; font-size: 12px; color: #8e8e8e;">Select a timezone for this conversation</p>
    </div>
    <div style="margin-bottom: 16px; position: relative;">
      <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: #262626;">
        Timezone:
      </label>
      <div id="chatclock-timezone-wrapper" style="position: relative;">
        <input
          type="text"
          id="chatclock-timezone-input"
          placeholder="Search timezone..."
          autocomplete="off"
          style="
            width: 100%;
            padding: 8px 12px;
            padding-right: 32px;
            border: 1px solid #dbdbdb;
            border-radius: 8px;
            font-size: 13px;
            background: #fff;
            color: #262626;
            box-sizing: border-box;
          "
        />
        <div id="chatclock-timezone-dropdown" style="
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          max-height: 200px;
          overflow-y: auto;
          background: #fff;
          border: 1px solid #dbdbdb;
          border-radius: 8px;
          margin-top: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000001;
        "></div>
      </div>
      <input type="hidden" id="chatclock-timezone-value" value="" />
    </div>
    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: #262626;">
        Badge Position:
      </label>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button class="chatclock-position-btn" data-position="top-left" style="
          padding: 8px 12px;
          border: 1px solid #dbdbdb;
          border-radius: 8px;
          background: #fff;
          color: #262626;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        ">Top Left</button>
        <button class="chatclock-position-btn" data-position="top-right" style="
          padding: 8px 12px;
          border: 1px solid #dbdbdb;
          border-radius: 8px;
          background: #fff;
          color: #262626;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        ">Top Right</button>
        <button class="chatclock-position-btn" data-position="bottom-left" style="
          padding: 8px 12px;
          border: 1px solid #dbdbdb;
          border-radius: 8px;
          background: #fff;
          color: #262626;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        ">Bottom Left</button>
        <button class="chatclock-position-btn" data-position="bottom-right" style="
          padding: 8px 12px;
          border: 1px solid #dbdbdb;
          border-radius: 8px;
          background: #fff;
          color: #262626;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        ">Bottom Right</button>
      </div>
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="chatclock-cancel-btn" style="
        padding: 8px 16px;
        border: 1px solid #dbdbdb;
        border-radius: 8px;
        background: #fff;
        color: #262626;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      ">Cancel</button>
      <button id="chatclock-save-btn" style="
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        background: #0095f6;
        color: #fff;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      ">Save</button>
    </div>
  `;

  document.body.appendChild(popoverEl);

  // Populate timezone select (async, will set up search)
  populateTimezoneSelect().then(() => {
    // Load current timezone if set (after timezones are loaded)
    loadTimezoneForPopover();
  });

  // Event listeners
  document
    .getElementById("chatclock-cancel-btn")
    .addEventListener("click", () => {
      hidePopover();
    });

  document
    .getElementById("chatclock-save-btn")
    .addEventListener("click", () => {
      saveTimezone();
    });

  // Position button handlers
  const positionButtons = document.querySelectorAll(".chatclock-position-btn");
  positionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const position = btn.dataset.position;
      selectPosition(position);
    });
  });

  loadPositionForPopover();

  // Close popover when clicking outside
  document.addEventListener("click", (e) => {
    if (popoverEl && popoverEl.style.display === "block") {
      if (!popoverEl.contains(e.target) && !badgeEl.contains(e.target)) {
        hidePopover();
      }
    }
  });

  return popoverEl;
}

let timezonesCache = null;

async function loadTimezonesFromJSON() {
  if (timezonesCache) return timezonesCache;

  try {
    const url = chrome.runtime.getURL("data/timezones.json");
    const response = await fetch(url);
    const data = await response.json();

    // Extract all unique timezones from all countries
    const timezoneSet = new Set();
    const timezoneToCountry = new Map();

    for (const countryCode in data.countries) {
      const country = data.countries[countryCode];
      for (const zone of country.zones) {
        if (!timezoneSet.has(zone)) {
          timezoneSet.add(zone);
          timezoneToCountry.set(zone, country.name);
        }
      }
    }

    // Convert to array and sort
    const timezones = Array.from(timezoneSet)
      .sort()
      .map((zone) => {
        const countryName = timezoneToCountry.get(zone);
        const label = countryName ? `${zone} (${countryName})` : zone;
        return { value: zone, label };
      });

    timezonesCache = timezones;
    return timezones;
  } catch (error) {
    console.error("Failed to load timezones:", error);
    return [];
  }
}

let allTimezones = [];

async function populateTimezoneSelect() {
  const input = document.getElementById("chatclock-timezone-input");
  const dropdown = document.getElementById("chatclock-timezone-dropdown");
  if (!input || !dropdown) return;

  allTimezones = await loadTimezonesFromJSON();

  // Store timezones in input element for easy access
  input.dataset.timezones = JSON.stringify(allTimezones);

  setupTimezoneSearch();

  return allTimezones;
}

function setupTimezoneSearch() {
  const input = document.getElementById("chatclock-timezone-input");
  const dropdown = document.getElementById("chatclock-timezone-dropdown");
  const hiddenInput = document.getElementById("chatclock-timezone-value");

  if (!input || !dropdown || !hiddenInput) return;

  let selectedIndex = -1;
  let filteredTimezones = [];

  function filterTimezones(searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      filteredTimezones = allTimezones.slice(0, 50); // Show first 50 when empty
    } else {
      const term = searchTerm.toLowerCase();
      filteredTimezones = allTimezones.filter(
        (tz) =>
          tz.label.toLowerCase().includes(term) ||
          tz.value.toLowerCase().includes(term)
      );
    }
    renderDropdown();
  }

  function renderDropdown() {
    dropdown.innerHTML = "";

    if (filteredTimezones.length === 0) {
      const noResults = document.createElement("div");
      noResults.style.cssText =
        "padding: 12px; text-align: center; color: #8e8e8e; font-size: 13px;";
      noResults.textContent = "No timezones found";
      dropdown.appendChild(noResults);
      dropdown.style.display = "block";
      return;
    }

    filteredTimezones.forEach((tz, index) => {
      const item = document.createElement("div");
      item.style.cssText = `
        padding: 10px 12px;
        cursor: pointer;
        font-size: 13px;
        color: #262626;
        border-bottom: 1px solid #f0f0f0;
      `;
      item.textContent = tz.label;
      item.dataset.value = tz.value;
      item.dataset.index = index;

      item.addEventListener("mouseenter", () => {
        item.style.background = "#f5f5f5";
      });
      item.addEventListener("mouseleave", () => {
        item.style.background = "#fff";
      });

      item.addEventListener("click", () => {
        selectTimezone(tz.value, tz.label);
      });

      dropdown.appendChild(item);
    });

    dropdown.style.display = "block";
    selectedIndex = -1;
  }

  function selectTimezone(value, label) {
    hiddenInput.value = value;
    input.value = label;
    dropdown.style.display = "none";
    selectedIndex = -1;
  }

  // Search input handler
  input.addEventListener("input", (e) => {
    filterTimezones(e.target.value);
  });

  // Focus handler
  input.addEventListener("focus", () => {
    if (input.value === "") {
      filterTimezones("");
    } else {
      filterTimezones(input.value);
    }
  });

  // Keyboard navigation
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredTimezones.length - 1);
      updateSelectedItem();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelectedItem();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredTimezones[selectedIndex]) {
        const tz = filteredTimezones[selectedIndex];
        selectTimezone(tz.value, tz.label);
      }
    } else if (e.key === "Escape") {
      dropdown.style.display = "none";
      selectedIndex = -1;
    }
  });

  function updateSelectedItem() {
    const items = dropdown.querySelectorAll("div[data-index]");
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.style.background = "#e3f2fd";
      } else {
        item.style.background = "#fff";
      }
    });

    // Scroll into view
    if (selectedIndex >= 0 && items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: "nearest" });
    }
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const wrapper = document.getElementById("chatclock-timezone-wrapper");
    if (wrapper && !wrapper.contains(e.target)) {
      dropdown.style.display = "none";
      selectedIndex = -1;
    }
  });
}

function togglePopover() {
  if (!popoverEl) {
    createPopover();
  }

  if (popoverEl.style.display === "block") {
    hidePopover();
  } else {
    showPopover();
  }
}

function showPopover() {
  if (!popoverEl) {
    createPopover();
    // populateTimezoneSelect is already called in createPopover
    // and will load timezone after timezones are loaded
  }
  applyPopoverPosition();
  popoverEl.style.display = "block";
  // Only load if timezones are already available
  if (allTimezones.length > 0) {
    loadTimezoneForPopover();
  }
}

function hidePopover() {
  if (popoverEl) {
    popoverEl.style.display = "none";
  }
}

function loadTimezoneForPopover() {
  if (!currentThreadId) return;

  chrome.runtime.sendMessage(
    { type: "GET_TIMEZONE", threadId: currentThreadId },
    (response) => {
      const input = document.getElementById("chatclock-timezone-input");
      const hiddenInput = document.getElementById("chatclock-timezone-value");
      if (input && hiddenInput && response && response.timezone) {
        // Find the timezone label
        const tz = allTimezones.find((t) => t.value === response.timezone);
        if (tz) {
          input.value = tz.label;
          hiddenInput.value = tz.value;
        }
      }
    }
  );
}

function loadPositionForPopover() {
  chrome.runtime.sendMessage({ type: "GET_POSITION" }, (response) => {
    if (response && response.position) {
      selectPosition(response.position, false);
    }
  });
}

function selectPosition(position, save = true) {
  badgePosition = position;

  // Update button styles
  const positionButtons = document.querySelectorAll(".chatclock-position-btn");
  positionButtons.forEach((btn) => {
    if (btn.dataset.position === position) {
      btn.style.background = "#0095f6";
      btn.style.color = "#fff";
      btn.style.borderColor = "#0095f6";
    } else {
      btn.style.background = "#fff";
      btn.style.color = "#262626";
      btn.style.borderColor = "#dbdbdb";
    }
  });

  // Update badge position
  applyBadgePosition();

  // Update popover position
  applyPopoverPosition();

  // Save position
  if (save) {
    chrome.runtime.sendMessage(
      { type: "SET_POSITION", position },
      (response) => {
        if (response && response.success) {
          // Position saved successfully
        }
      }
    );
  }
}

function saveTimezone() {
  if (!currentThreadId) return;

  const hiddenInput = document.getElementById("chatclock-timezone-value");
  const timezone = hiddenInput ? hiddenInput.value : null;

  if (!timezone) {
    alert("Please select a timezone");
    return;
  }

  chrome.runtime.sendMessage(
    { type: "SET_TIMEZONE", threadId: currentThreadId, timezone },
    (response) => {
      if (response && response.success) {
        hidePopover();
        loadTimezone(currentThreadId);
      }
    }
  );
}

/* -----------------------------
   Time formatting
------------------------------ */

function formatTime(timezone) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
  } catch {
    return "Invalid TZ";
  }
}

function formatTimezoneLabel(timezone) {
  // Convert "America/New_York" to "ET" or similar
  const labels = {
    "America/New_York": "ET",
    "America/Chicago": "CT",
    "America/Denver": "MT",
    "America/Los_Angeles": "PT",
    "America/Phoenix": "MST",
    "America/Anchorage": "AKT",
    "Pacific/Honolulu": "HST",
    "Europe/London": "GMT",
    "Europe/Paris": "CET",
    "Europe/Berlin": "CET",
    "Asia/Tokyo": "JST",
    "Asia/Shanghai": "CST",
    "Asia/Hong_Kong": "HKT",
    "Asia/Singapore": "SGT",
    "Asia/Seoul": "KST",
    "Asia/Kolkata": "IST",
  };
  return labels[timezone] || timezone.split("/").pop().replace("_", " ");
}

/* -----------------------------
   Background communication
------------------------------ */

function loadTimezone(threadId) {
  chrome.runtime.sendMessage({ type: "GET_TIMEZONE", threadId }, (response) => {
    if (!response || !response.timezone) {
      updateBadge("Click to set timezone");
      return;
    }

    const time = formatTime(response.timezone);
    const label = formatTimezoneLabel(response.timezone);
    updateBadge(`${label} ${time}`);

    // Update time every minute
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval);
    }
    timeUpdateInterval = setInterval(() => {
      const updatedTime = formatTime(response.timezone);
      const updatedLabel = formatTimezoneLabel(response.timezone);
      updateBadge(`${updatedLabel} ${updatedTime}`);
    }, 60000);
  });
}

/* -----------------------------
   Thread change handling
------------------------------ */

function onThreadChange(newThreadId) {
  currentThreadId = newThreadId;

  if (!newThreadId) {
    removeBadge();
    return;
  }

  if (!isValidWebsite()) {
    removeBadge();
    return;
  }

  loadTimezone(newThreadId);
}

/* -----------------------------
   SPA URL observer
------------------------------ */

function startUrlObserver() {
  let lastPath = window.location.pathname;

  setInterval(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      const threadId = getThreadId();

      if (threadId !== currentThreadId) {
        onThreadChange(threadId);
      }
    }
  }, 500);
}

/* -----------------------------
   Init
------------------------------ */

function loadBadgePosition() {
  chrome.runtime.sendMessage({ type: "GET_POSITION" }, (response) => {
    if (response && response.position) {
      badgePosition = response.position;
      if (badgeEl) {
        applyBadgePosition();
      }
    }
  });
}

(function init() {
  // Load badge position first
  loadBadgePosition();

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      const threadId = getThreadId();
      onThreadChange(threadId);
      startUrlObserver();
    });
  } else {
    const threadId = getThreadId();
    onThreadChange(threadId);
    startUrlObserver();
  }
})();
