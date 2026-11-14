// TogetherTube YouTube Content Script

console.log("[TogetherTube] Content script initialized on YouTube.");

let isRemoteUpdate = false;
let remoteUpdateTimer: NodeJS.Timeout | null = null;

function setRemoteUpdateFlag(durationMs = 600) {
  isRemoteUpdate = true;
  if (remoteUpdateTimer) clearTimeout(remoteUpdateTimer);
  remoteUpdateTimer = setTimeout(() => {
    isRemoteUpdate = false;
  }, durationMs);
}

function getVideoElement(): HTMLVideoElement | null {
  return (
    document.querySelector("video.video-stream.html5-main-video") ||
    document.querySelector(".html5-video-player video") ||
    document.querySelector("#movie_player video") ||
    document.querySelector("video")
  );
}

function getVideoId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("v");
}

function getVideoMetadata() {
  const video = getVideoElement();
  const videoId = getVideoId();
  if (!videoId || !video) return null;

  // Title selector fallback chain
  const titleEl =
    document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
    document.querySelector("#title h1 yt-formatted-string") ||
    document.querySelector("h1.title yt-formatted-string") ||
    document.querySelector("#title h1");

  const title = titleEl?.textContent?.trim() || document.title.replace(" - YouTube", "");

  // Channel name selector fallback
  const channelEl =
    document.querySelector("#channel-name #text") ||
    document.querySelector("#owner #channel-name a") ||
    document.querySelector("ytd-channel-name a");

  const channel = channelEl?.textContent?.trim() || "YouTube Channel";

  return {
    id: videoId,
    title,
    channel,
    durationSec: Math.floor(video.duration || 600),
    positionSec: video.currentTime || 0,
    isPlaying: !video.paused && !video.ended,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    url: window.location.href,
  };
}

// Hook into video element events
function attachVideoListeners() {
  const video = getVideoElement();
  if (!video || (video as any).__togethertube_attached) return;
  (video as any).__togethertube_attached = true;

  video.addEventListener("play", () => {
    if (isRemoteUpdate) return;
    chrome.runtime
      .sendMessage({
        type: "LOCAL_PLAYER_EVENT",
        action: "play",
        currentTime: video.currentTime,
      })
      .catch(() => {});
  });

  video.addEventListener("pause", () => {
    if (isRemoteUpdate) return;
    chrome.runtime
      .sendMessage({
        type: "LOCAL_PLAYER_EVENT",
        action: "pause",
        currentTime: video.currentTime,
      })
      .catch(() => {});
  });

  video.addEventListener("seeked", () => {
    if (isRemoteUpdate) return;
    chrome.runtime
      .sendMessage({
        type: "LOCAL_PLAYER_EVENT",
        action: "seek",
        currentTime: video.currentTime,
      })
      .catch(() => {});
  });

  console.log("[TogetherTube] Attached to YouTube HTML5 video player.");
}

// Watch for SPA URL changes and player mounting
let lastUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    const meta = getVideoMetadata();
    if (meta) {
      chrome.runtime.sendMessage({ type: "YOUTUBE_URL_CHANGED", data: meta }).catch(() => {});
    }
  }
  attachVideoListeners();
}, 1000);

// Listen for commands from extension popup / service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const video = getVideoElement();

  switch (message.type) {
    case "GET_YOUTUBE_INFO": {
      const meta = getVideoMetadata();
      sendResponse({ ok: !!meta, data: meta });
      return true;
    }

    case "SYNC_PLAY": {
      if (video) {
        setRemoteUpdateFlag(800);
        if (typeof message.positionSec === "number" && Math.abs(video.currentTime - message.positionSec) > 0.5) {
          video.currentTime = message.positionSec;
        }
        if (video.paused) {
          const promise = video.play();
          if (promise !== undefined) {
            promise.catch(() => {
              const btn = document.querySelector(".ytp-play-button") as HTMLElement | null;
              btn?.click();
            });
          }
        }
        sendResponse({ ok: true, currentTime: video.currentTime });
      } else {
        sendResponse({ ok: false, error: "Video element not found" });
      }
      return true;
    }

    case "SYNC_PAUSE": {
      if (video) {
        setRemoteUpdateFlag(800);
        if (typeof message.positionSec === "number" && Math.abs(video.currentTime - message.positionSec) > 0.5) {
          video.currentTime = message.positionSec;
        }
        if (!video.paused) {
          video.pause();
          if (!video.paused) {
            const btn = document.querySelector(".ytp-play-button") as HTMLElement | null;
            btn?.click();
          }
        }
        sendResponse({ ok: true, currentTime: video.currentTime });
      } else {
        sendResponse({ ok: false, error: "Video element not found" });
      }
      return true;
    }

    case "SYNC_SEEK": {
      if (video && typeof message.positionSec === "number") {
        setRemoteUpdateFlag(800);
        video.currentTime = message.positionSec;
        sendResponse({ ok: true, currentTime: video.currentTime });
      } else {
        sendResponse({ ok: false, error: "Seek failed" });
      }
      return true;
    }

    case "NAVIGATE_VIDEO": {
      if (message.videoId && message.videoId !== getVideoId()) {
        window.location.href = `https://www.youtube.com/watch?v=${message.videoId}`;
        sendResponse({ ok: true });
      }
      return true;
    }
  }

  return false;
});
