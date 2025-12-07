import { configRead, configChangeEmitter } from '../config.js';
import { showNotification } from '../ui/ui.js';
import { showControlOverlay, hideControlOverlay } from './tvRemoteControls.js';

/**
 * Enhanced video controls for IYF TV
 * Optimized for TV remote control
 */

let videoElement = null;
let playbackSpeed = 1;
let isVideoFocused = false;
let lastKeyPressTime = 0;
let seekTimeout = null;

// TV Remote Key Codes
const TV_KEYS = {
  // Media keys (from TVInputDevice API)
  MEDIA_PLAY_PAUSE: 415,
  MEDIA_PLAY: 415,
  MEDIA_PAUSE: 19, // Pause key
  MEDIA_STOP: 413,
  MEDIA_FAST_FORWARD: 417,
  MEDIA_REWIND: 412,
  MEDIA_TRACK_NEXT: 421,
  MEDIA_TRACK_PREVIOUS: 424,

  // Arrow keys
  ARROW_LEFT: 37,
  ARROW_RIGHT: 39,
  ARROW_UP: 38,
  ARROW_DOWN: 40,

  // OK/Enter button
  OK: 13,
  ENTER: 13,

  // Space bar (fallback)
  SPACE: 32,

  // Color buttons (Tizen TV)
  RED: 403,
  GREEN: 404,
  YELLOW: 405,
  BLUE: 406,
};

function findVideoElement() {
  // Try multiple selectors to find video element
  return document.querySelector('video') ||
         document.querySelector('[class*="video"]') ||
         document.querySelector('[id*="video"]') ||
         document.querySelector('video[class*="player"]');
}

function isVideoPlaying() {
  return videoElement && !videoElement.paused && !videoElement.ended;
}

function initVideoControls() {
  const interval = setInterval(() => {
    videoElement = findVideoElement();
    if (videoElement) {
      clearInterval(interval);
      setupVideoControls();
    }
  }, 500);

  // Also check periodically for dynamically loaded videos
  setTimeout(() => {
    if (!videoElement) {
      videoElement = findVideoElement();
      if (videoElement) {
        setupVideoControls();
      }
    }
  }, 2000);
}

function setupVideoControls() {
  if (!videoElement) return;

  playbackSpeed = configRead('videoSpeed');
  videoElement.playbackRate = playbackSpeed;

  // Listen for config changes
  configChangeEmitter.addEventListener('configChange', (event) => {
    if (event.detail?.key === 'videoSpeed') {
      playbackSpeed = configRead('videoSpeed');
      if (videoElement) {
        videoElement.playbackRate = playbackSpeed;
      }
    }
  });

  // Detect when video is focused/active
  videoElement.addEventListener('play', () => {
    isVideoFocused = true;
  });

  videoElement.addEventListener('pause', () => {
    // Keep focus for a short time after pause
    setTimeout(() => {
      if (videoElement && videoElement.paused) {
        isVideoFocused = false;
      }
    }, 2000);
  });

  // Add TV remote event listeners
  if (configRead('enableKeyboardShortcuts')) {
    document.addEventListener('keydown', handleKeyPress, true);
    document.addEventListener('keyup', handleKeyUp, true);
  }

  // Register TVInputDevice API if available
  registerTVInputDevice();
}

function registerTVInputDevice() {
  // Register media keys with TVInputDevice API (Tizen TV)
  if (window.tizen && window.tizen.tvinputdevice) {
    try {
      const keys = [
        'MediaPlayPause',
        'MediaPlay',
        'MediaPause',
        'MediaStop',
        'MediaFastForward',
        'MediaRewind',
        'MediaTrackNext',
        'MediaTrackPrevious'
      ];

      keys.forEach(key => {
        try {
          window.tizen.tvinputdevice.registerKey(key);
        } catch (e) {
          console.warn('Failed to register key:', key, e);
        }
      });

      console.log('TVInputDevice keys registered successfully');
    } catch (e) {
      console.warn('TVInputDevice API not available:', e);
    }
  }
}

function handleKeyPress(event) {
  if (!videoElement) {
    // Try to find video element again
    videoElement = findVideoElement();
    if (!videoElement) return;
  }

  const keyCode = event.keyCode || event.which;
  const now = Date.now();

  // Only handle keys when video is playing or recently paused
  // Don't interfere with spatial navigation when video is not playing
  if (!isVideoPlaying() && !isVideoFocused && (now - lastKeyPressTime) > 3000) {
    return; // Let spatial navigation handle it
  }

  // Don't intercept arrow keys if video is not playing (let spatial nav handle them)
  const arrowKeys = [TV_KEYS.ARROW_UP, TV_KEYS.ARROW_DOWN, TV_KEYS.ARROW_LEFT, TV_KEYS.ARROW_RIGHT];
  if (arrowKeys.includes(keyCode) && !isVideoPlaying() && !isVideoFocused) {
    return; // Let spatial navigation handle arrow keys
  }

  lastKeyPressTime = now;

  // Media Play/Pause button
  if (keyCode === TV_KEYS.MEDIA_PLAY_PAUSE || keyCode === TV_KEYS.SPACE) {
    event.preventDefault();
    event.stopPropagation();
    togglePlayPause();
    return false;
  }

  // Media Stop button
  if (keyCode === TV_KEYS.MEDIA_STOP) {
    event.preventDefault();
    event.stopPropagation();
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
      showNotification('Stopped', 1000);
    }
    return false;
  }

  // Media Fast Forward (or Right Arrow when video is playing)
  if (keyCode === TV_KEYS.MEDIA_FAST_FORWARD ||
      (keyCode === TV_KEYS.ARROW_RIGHT && isVideoPlaying())) {
    event.preventDefault();
    event.stopPropagation();
    seekVideo(10); // Forward 10 seconds
    return false;
  }

  // Media Rewind (or Left Arrow when video is playing)
  if (keyCode === TV_KEYS.MEDIA_REWIND ||
      (keyCode === TV_KEYS.ARROW_LEFT && isVideoPlaying())) {
    event.preventDefault();
    event.stopPropagation();
    seekVideo(-10); // Backward 10 seconds
    return false;
  }

  // Volume Up (Up Arrow when video is playing)
  if (keyCode === TV_KEYS.ARROW_UP && isVideoPlaying()) {
    event.preventDefault();
    event.stopPropagation();
    adjustVolume(0.1);
    return false;
  }

  // Volume Down (Down Arrow when video is playing)
  if (keyCode === TV_KEYS.ARROW_DOWN && isVideoPlaying()) {
    event.preventDefault();
    event.stopPropagation();
    adjustVolume(-0.1);
    return false;
  }

  // OK/Enter button - Play/Pause when video is visible
  if ((keyCode === TV_KEYS.OK || keyCode === TV_KEYS.ENTER) && isVideoPlaying()) {
    // Only prevent default if video is actively playing
    if (videoElement && videoElement.offsetParent !== null) {
      event.preventDefault();
      event.stopPropagation();
      togglePlayPause();
      return false;
    }
  }

  // Color buttons for additional controls
  // Red button - Stop
  if (keyCode === TV_KEYS.RED && isVideoPlaying()) {
    event.preventDefault();
    event.stopPropagation();
    if (videoElement) {
      videoElement.pause();
      showNotification('Paused', 1000);
    }
    return false;
  }

  // Green button - Play
  if (keyCode === TV_KEYS.GREEN && videoElement && videoElement.paused) {
    event.preventDefault();
    event.stopPropagation();
    videoElement.play();
    showNotification('Playing', 1000);
    return false;
  }
}

function handleKeyUp(event) {
  // Clear seek timeout on key release for smooth seeking
  if (seekTimeout) {
    clearTimeout(seekTimeout);
    seekTimeout = null;
  }
}

function togglePlayPause() {
  if (!videoElement) return;

  if (videoElement.paused) {
    videoElement.play().catch(e => {
      console.error('Failed to play video:', e);
    });
    showNotification('▶ Playing', 1000);
    showControlOverlay();
  } else {
    videoElement.pause();
    showNotification('⏸ Paused', 1000);
    showControlOverlay();
  }
}

function seekVideo(seconds) {
  if (!videoElement || !videoElement.duration) return;

  const newTime = Math.max(0, Math.min(videoElement.duration, videoElement.currentTime + seconds));
  videoElement.currentTime = newTime;

  const direction = seconds > 0 ? '⏩' : '⏪';
  const absSeconds = Math.abs(seconds);
  showNotification(`${direction} ${absSeconds}s`, 800);
  showControlOverlay();

  // Update last key press time to keep video focused
  lastKeyPressTime = Date.now();
  isVideoFocused = true;
}

function adjustVolume(delta) {
  if (!videoElement) return;

  const newVolume = Math.max(0, Math.min(1, videoElement.volume + delta));
  videoElement.volume = newVolume;

  const volumePercent = Math.round(newVolume * 100);
  showNotification(`🔊 Volume: ${volumePercent}%`, 1000);
  showControlOverlay();

  // Update last key press time
  lastKeyPressTime = Date.now();
  isVideoFocused = true;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVideoControls);
} else {
  initVideoControls();
}

// Also watch for dynamically added videos
const videoObserver = new MutationObserver(() => {
  if (!videoElement) {
    videoElement = findVideoElement();
    if (videoElement) {
      setupVideoControls();
    }
  }
});

if (document.body) {
  videoObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

