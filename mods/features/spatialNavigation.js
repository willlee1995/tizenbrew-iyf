import { configRead } from '../config.js';
import '../ui/navigation.css';

/**
 * Spatial Navigation for IYF TV
 * Enables TV remote navigation through video lists and grids
 */

let isInitialized = false;
let navigationEnabled = true;

// TV Remote Key Codes
const NAV_KEYS = {
  ARROW_UP: 38,
  ARROW_DOWN: 40,
  ARROW_LEFT: 37,
  ARROW_RIGHT: 39,
  OK: 13,
  ENTER: 13,
  BACK: 27, // ESC key
};

function initSpatialNavigation() {
  if (isInitialized) return;

  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNavigation);
  } else {
    setupNavigation();
  }

  isInitialized = true;
}

function setupNavigation() {
  // Make video items focusable
  makeVideoItemsFocusable();

  // Add keyboard event listeners
  document.addEventListener('keydown', handleNavigation, true);

  // Watch for dynamically added content
  observeVideoContainers();

  // Set initial focus if possible
  setTimeout(() => {
    focusFirstVideo();
  }, 1000);
}

function makeVideoItemsFocusable() {
  // Find all potential video containers/cards with more specific selectors
  const videoSelectors = [
    'a[href*="/play"]',
    'a[href*="/video"]',
    'a[href*="/movie"]',
    'a[href*="/detail"]',
    'a[href*="/film"]',
    '[class*="video"]',
    '[class*="card"]',
    '[class*="item"]',
    '[class*="movie"]',
    '[class*="film"]',
    '[class*="poster"]',
    '[class*="thumbnail"]',
    '[id*="video"]',
    '[id*="movie"]',
  ];

  const processedElements = new Set();

  videoSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // Skip if already processed
        if (processedElements.has(el)) return;

        // Skip if already focusable
        if (el.tabIndex >= 0 && el.classList.contains('iyf-tv-focusable')) return;

        // Make focusable if it looks like a video item
        if (isVideoItem(el)) {
          processedElements.add(el);

          // Ensure it's focusable
          if (el.tabIndex < 0) {
            el.setAttribute('tabindex', '0');
          }
          el.classList.add('iyf-tv-focusable');

          // Add focus styles (use once to avoid duplicates)
          if (!el.hasAttribute('data-iyf-listener')) {
            el.setAttribute('data-iyf-listener', 'true');

            el.addEventListener('focus', function() {
              this.classList.add('iyf-tv-focused');
              scrollIntoViewIfNeeded(this);
            });

            el.addEventListener('blur', function() {
              this.classList.remove('iyf-tv-focused');
            });

            // Handle click/select
            el.addEventListener('click', function(e) {
              if (e.detail === 0 || e.button === 0) {
                handleVideoSelect(this);
              }
            });
          }
        }
      });
    } catch (e) {
      console.warn('Error making items focusable:', e);
    }
  });

  console.log(`Made ${processedElements.size} video items focusable`);
}

function isVideoItem(element) {
  // Skip if element is too small or hidden
  const rect = element.getBoundingClientRect();
  if (rect.width < 50 || rect.height < 50) return false;
  if (rect.width === 0 || rect.height === 0) return false;

  // Check if element looks like a video item
  const text = element.textContent || '';
  const href = element.href || element.getAttribute('href') || '';
  const className = element.className || '';
  const id = element.id || '';

  // Check for video-related attributes
  const hasVideoLink = href.includes('/play') ||
                       href.includes('/video') ||
                       href.includes('/movie') ||
                       href.includes('/watch') ||
                       href.includes('/detail') ||
                       href.includes('/film');

  const hasVideoClass = className.toLowerCase().includes('video') ||
                        className.toLowerCase().includes('movie') ||
                        className.toLowerCase().includes('card') ||
                        className.toLowerCase().includes('item') ||
                        className.toLowerCase().includes('film') ||
                        className.toLowerCase().includes('poster') ||
                        className.toLowerCase().includes('thumbnail');

  const hasVideoId = id.toLowerCase().includes('video') ||
                     id.toLowerCase().includes('movie') ||
                     id.toLowerCase().includes('card');

  // Check if it's a clickable element
  const isClickable = element.tagName === 'A' ||
                      element.onclick ||
                      element.getAttribute('onclick') ||
                      element.style.cursor === 'pointer' ||
                      element.getAttribute('role') === 'button' ||
                      element.getAttribute('role') === 'link';

  // Check if it has an image (video thumbnails usually have images)
  const hasImage = element.querySelector('img') !== null;

  // Check parent elements for video-related classes
  let parent = element.parentElement;
  let parentHasVideoClass = false;
  let depth = 0;
  while (parent && depth < 3) {
    const parentClass = parent.className || '';
    if (parentClass.toLowerCase().includes('video') ||
        parentClass.toLowerCase().includes('movie') ||
        parentClass.toLowerCase().includes('list') ||
        parentClass.toLowerCase().includes('grid')) {
      parentHasVideoClass = true;
      break;
    }
    parent = parent.parentElement;
    depth++;
  }

  // More lenient: if it has an image and is in a video container, or is clickable with video link
  return (hasImage && (hasVideoLink || hasVideoClass || hasVideoId || parentHasVideoClass)) ||
         (hasVideoLink && isClickable) ||
         (hasImage && isClickable && (hasVideoClass || parentHasVideoClass));
}

function handleNavigation(event) {
  if (!navigationEnabled) return;

  const keyCode = event.keyCode || event.which;
  const focusedElement = document.activeElement;

  // Only handle navigation if we're on a focusable video item or no element is focused
  if (focusedElement && !focusedElement.classList.contains('iyf-tv-focusable') &&
      focusedElement !== document.body && focusedElement !== document.documentElement) {
    // If focused on an input or textarea, don't interfere
    if (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA') {
      return;
    }
  }

  switch (keyCode) {
    case NAV_KEYS.ARROW_UP:
      event.preventDefault();
      event.stopPropagation();
      navigateDirection('up', focusedElement);
      return false;

    case NAV_KEYS.ARROW_DOWN:
      event.preventDefault();
      event.stopPropagation();
      navigateDirection('down', focusedElement);
      return false;

    case NAV_KEYS.ARROW_LEFT:
      // Only handle if video is not playing
      if (!isVideoPlaying()) {
        event.preventDefault();
        event.stopPropagation();
        navigateDirection('left', focusedElement);
        return false;
      }
      break;

    case NAV_KEYS.ARROW_RIGHT:
      // Only handle if video is not playing
      if (!isVideoPlaying()) {
        event.preventDefault();
        event.stopPropagation();
        navigateDirection('right', focusedElement);
        return false;
      }
      break;

    case NAV_KEYS.OK:
    case NAV_KEYS.ENTER:
      if (focusedElement && focusedElement.classList.contains('iyf-tv-focusable')) {
        event.preventDefault();
        event.stopPropagation();
        handleVideoSelect(focusedElement);
        return false;
      }
      break;
  }
}

function navigateDirection(direction, currentElement) {
  const focusableElements = Array.from(document.querySelectorAll('.iyf-tv-focusable'));

  if (focusableElements.length === 0) {
    // Try to make items focusable again
    makeVideoItemsFocusable();
    const newElements = Array.from(document.querySelectorAll('.iyf-tv-focusable'));
    if (newElements.length > 0) {
      newElements[0].focus();
    }
    return;
  }

  let currentIndex = -1;
  if (currentElement && currentElement.classList.contains('iyf-tv-focusable')) {
    currentIndex = focusableElements.indexOf(currentElement);
  }

  let nextIndex = currentIndex;

  switch (direction) {
    case 'up':
      if (currentIndex <= 0) {
        nextIndex = focusableElements.length - 1; // Wrap to bottom
      } else {
        nextIndex = currentIndex - 1;
      }
      break;

    case 'down':
      if (currentIndex >= focusableElements.length - 1) {
        nextIndex = 0; // Wrap to top
      } else {
        nextIndex = currentIndex + 1;
      }
      break;

    case 'left':
      // Find element to the left (same row, previous column)
      nextIndex = findElementInDirection(currentElement, focusableElements, 'left');
      break;

    case 'right':
      // Find element to the right (same row, next column)
      nextIndex = findElementInDirection(currentElement, focusableElements, 'right');
      break;
  }

  if (nextIndex >= 0 && nextIndex < focusableElements.length) {
    focusableElements[nextIndex].focus();
    focusableElements[nextIndex].scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  } else if (focusableElements.length > 0) {
    // Fallback: focus first element
    focusableElements[0].focus();
  }
}

function findElementInDirection(currentElement, allElements, direction) {
  if (!currentElement || allElements.length === 0) return 0;

  const currentRect = currentElement.getBoundingClientRect();
  const currentCenterY = currentRect.top + currentRect.height / 2;

  // Find elements in the same row (similar Y position)
  const sameRowElements = allElements.filter(el => {
    if (el === currentElement) return false;
    const rect = el.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    // Consider same row if Y centers are within 50px
    return Math.abs(centerY - currentCenterY) < 50;
  });

  if (sameRowElements.length === 0) {
    // No elements in same row, just move to next/previous
    const currentIndex = allElements.indexOf(currentElement);
    return direction === 'right' ?
      Math.min(currentIndex + 1, allElements.length - 1) :
      Math.max(currentIndex - 1, 0);
  }

  // Find closest element in the direction
  const currentRectLeft = currentRect.left;
  let bestElement = null;
  let bestDistance = Infinity;

  sameRowElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const distance = direction === 'right' ?
      rect.left - currentRectLeft :
      currentRectLeft - rect.left;

    if (distance > 0 && distance < bestDistance) {
      bestDistance = distance;
      bestElement = el;
    }
  });

  if (bestElement) {
    return allElements.indexOf(bestElement);
  }

  // Fallback
  const currentIndex = allElements.indexOf(currentElement);
  return direction === 'right' ?
    Math.min(currentIndex + 1, allElements.length - 1) :
    Math.max(currentIndex - 1, 0);
}

function handleVideoSelect(element) {
  // Try to click the element
  if (element.tagName === 'A') {
    // If it's a link, navigate to it
    window.location.href = element.href;
  } else {
    // Try to find a link inside
    const link = element.querySelector('a');
    if (link) {
      window.location.href = link.href;
    } else {
      // Trigger click event
      element.click();
    }
  }
}

function focusFirstVideo() {
  const focusableElements = document.querySelectorAll('.iyf-tv-focusable');
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}

function scrollIntoViewIfNeeded(element) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Check if element is outside viewport
  if (rect.top < 0 || rect.bottom > viewportHeight ||
      rect.left < 0 || rect.right > viewportWidth) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
  }
}

function isVideoPlaying() {
  const video = document.querySelector('video');
  return video && !video.paused && !video.ended;
}

function observeVideoContainers() {
  // Watch for dynamically added content
  const observer = new MutationObserver(() => {
    makeVideoItemsFocusable();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize
initSpatialNavigation();

