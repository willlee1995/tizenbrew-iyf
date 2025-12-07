import { configRead, configChangeEmitter } from '../config.js';

/**
 * Enhanced video controls for IYF TV
 * Adds keyboard shortcuts and playback controls
 */

let videoElement = null;
let playbackSpeed = 1;

function findVideoElement() {
  return document.querySelector('video') || document.querySelector('[class*="video"]');
}

function initVideoControls() {
  const interval = setInterval(() => {
    videoElement = findVideoElement();
    if (videoElement) {
      clearInterval(interval);
      setupVideoControls();
    }
  }, 500);
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

  // Add keyboard shortcuts
  if (configRead('enableKeyboardShortcuts')) {
    document.addEventListener('keydown', handleKeyPress, true);
  }
}

function handleKeyPress(event) {
  if (!videoElement) return;

  // Space: Play/Pause
  if (event.keyCode === 32 || event.keyCode === 415) {
    event.preventDefault();
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  }
  // Left Arrow: Rewind 10 seconds
  else if (event.keyCode === 37) {
    event.preventDefault();
    videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
  }
  // Right Arrow: Forward 10 seconds
  else if (event.keyCode === 39) {
    event.preventDefault();
    videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 10);
  }
  // Up Arrow: Increase volume
  else if (event.keyCode === 38) {
    event.preventDefault();
    videoElement.volume = Math.min(1, videoElement.volume + 0.1);
  }
  // Down Arrow: Decrease volume
  else if (event.keyCode === 40) {
    event.preventDefault();
    videoElement.volume = Math.max(0, videoElement.volume - 0.1);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVideoControls);
} else {
  initVideoControls();
}

