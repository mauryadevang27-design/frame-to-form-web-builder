// Chrome Manifest V3 Service Worker

// Enable side panel on action click if supported
if (typeof chrome !== "undefined" && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: false })
    .catch((err) => console.log("SidePanel error:", err));
}

// Relay messages between tabs and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({ status: "PONG" });
    return true;
  }

  // Handle active YouTube tab inquiry
  if (message.type === "GET_ACTIVE_YOUTUBE_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.url && activeTab.url.includes("youtube.com/watch")) {
        sendResponse({ tab: activeTab });
      } else {
        // Look for any open YouTube watch tab in the current window
        chrome.tabs.query({ currentWindow: true }, (allTabs) => {
          const ytTab = allTabs.find((t) => t.url && t.url.includes("youtube.com/watch"));
          sendResponse({ tab: ytTab || null });
        });
      }
    });
    return true;
  }

  return false;
});
