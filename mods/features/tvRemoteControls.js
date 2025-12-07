import { configRead } from '../config.js';
import { showNotification } from '../ui/ui.js';

/**
 * TV Remote Control Overlay
 * Shows on-screen controls when video is playing
 */

let controlOverlay = null;
let hideTimeout = null;
let isOverlayVisible = false;

function createControlOverlay() {
  if (controlOverlay) return controlOverlay;

  const overlay = document.createElement('div');
  overlay.id = 'iyf-tv-control-overlay';
  overlay.innerHTML = `
    <div class="iyf-tv-controls-container">
      <div class="iyf-tv-controls-row">
        <div class="iyf-tv-control-item">
          <div class="iyf-tv-control-key">⏮</div>
          <div class="iyf-tv-control-label">Rewind</div>
        </div>
        <div class="iyf-tv-control-item">
          <div class="iyf-tv-control-key">⏯</div>
          <div class="iyf-tv-control-label">Play/Pause</div>
        </div>
        <div class="iyf-tv-control-item">
          <div class="iyf-tv-control-key">⏭</div>
          <div class="iyf-tv-control-label">Forward</div>
        </div>
      </div>
      <div class="iyf-tv-controls-row">
        <div class="iyf-tv-control-item">
          <div class="iyf-tv-control-key">🔊</div>
          <div class="iyf-tv-control-label">Volume</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  controlOverlay = overlay;
  return overlay;
}

function showControlOverlay() {
  if (!configRead('enableFullscreenControls')) return;

  const overlay = createControlOverlay();
  overlay.classList.add('visible');
  isOverlayVisible = true;

  // Auto-hide after 3 seconds
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    hideControlOverlay();
  }, 3000);
}

function hideControlOverlay() {
  if (controlOverlay) {
    controlOverlay.classList.remove('visible');
    isOverlayVisible = false;
  }
}

// Export functions for use by videoControls
export { showControlOverlay, hideControlOverlay };

