const CONFIG_KEY = 'iyf-tv-configuration';
const defaultConfig = {
  enableAdBlock: true,
  enableVideoQuality: true,
  preferredVideoQuality: 'auto',
  enableKeyboardShortcuts: true,
  enableUIEnhancements: true,
  enableFullscreenControls: true,
  videoSpeed: 1,
  focusContainerColor: '#0f0f0f',
  routeColor: '#0f0f0f',
  showWelcomeToast: true,
};

let localConfig;

try {
  localConfig = JSON.parse(window.localStorage[CONFIG_KEY] || '{}');
} catch (err) {
  console.warn('Config read failed:', err);
  localConfig = {};
}

export function configRead(key) {
  if (localConfig[key] === undefined) {
    console.warn('Populating key', key, 'with default value', defaultConfig[key]);
    localConfig[key] = defaultConfig[key];
  }
  return localConfig[key];
}

export function configWrite(key, value) {
  console.info('Setting key', key, 'to', value);
  localConfig[key] = value;
  window.localStorage[CONFIG_KEY] = JSON.stringify(localConfig);
  configChangeEmitter.dispatchEvent(new CustomEvent('configChange', { detail: { key, value } }));
}

export const configChangeEmitter = {
  listeners: {},
  addEventListener(type, callback) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(callback);
  },
  removeEventListener(type, callback) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
  },
  dispatchEvent(event) {
    const type = event.type;
    if (!this.listeners[type]) return;
    this.listeners[type].forEach(cb => cb.call(this, event));
  }
};

