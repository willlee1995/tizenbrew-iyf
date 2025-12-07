import { configRead } from '../config.js';
import './ui.css';

/**
 * UI enhancements for IYF TV
 */

function initUI() {
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    /* Custom UI styles */
    .iyf-tv-mod-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 9999;
    }

    .iyf-tv-mod-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-size: 16px;
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  // Create notification container
  const container = document.createElement('div');
  container.className = 'iyf-tv-mod-container';
  document.body.appendChild(container);

  // Show welcome message
  if (configRead('showWelcomeToast')) {
    setTimeout(() => {
      showNotification('IYF TV Mod loaded successfully');
    }, 1000);
  }
}

function showNotification(message, duration = 3000) {
  const container = document.querySelector('.iyf-tv-mod-container');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = 'iyf-tv-mod-notification';
  notification.textContent = message;
  container.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

// Initialize UI when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}

export { showNotification };

