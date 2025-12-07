import { configRead } from '../config.js';

/**
 * Ad blocking for IYF TV
 * Intercepts network requests and removes ad elements from the DOM
 */

let adBlockEnabled = false;

function initAdBlock() {
  adBlockEnabled = configRead('enableAdBlock');

  if (!adBlockEnabled) {
    return;
  }

  // Remove common ad elements
  const adSelectors = [
    '[class*="ad"]',
    '[id*="ad"]',
    '[class*="advertisement"]',
    '[id*="advertisement"]',
    '[class*="banner"]',
    'iframe[src*="ad"]',
    'iframe[src*="ads"]',
  ];

  function removeAds() {
    adSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          // Be careful not to remove legitimate content
          if (el.textContent && el.textContent.toLowerCase().includes('广告')) {
            el.remove();
          }
        });
      } catch (e) {
        // Ignore errors
      }
    });
  }

  // Remove ads on page load
  if (document.readyState === 'complete') {
    removeAds();
  } else {
    window.addEventListener('load', removeAds);
  }

  // Use MutationObserver to remove ads dynamically
  const observer = new MutationObserver(() => {
    removeAds();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Intercept fetch requests for ads
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && (url.includes('ad') || url.includes('ads') || url.includes('advertisement'))) {
      return Promise.reject(new Error('Ad blocked'));
    }
    return originalFetch.apply(this, args);
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdBlock);
} else {
  initAdBlock();
}

