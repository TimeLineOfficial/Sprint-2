import { stateManager, EVENTS } from './state.js';
import { eventBus } from './pubsub.js';

let cleanupFn = null;

export function initTheme() {
  const toggleBtn = document.getElementById('theme-toggle');

  // Clean previous subscription if re-initialized to prevent leaks
  if (cleanupFn) cleanupFn();

  // Apply initial theme from state
  const initialTheme = stateManager.get('theme');
  applyThemeDOM(initialTheme);

  // Subscribe to theme mutations via PubSub
  cleanupFn = eventBus.subscribe(EVENTS.THEME_CHANGED, ({ theme }) => {
    applyThemeDOM(theme);
  });

  if (toggleBtn) {
    toggleBtn.onclick = (e) => {
      e.preventDefault();
      stateManager.toggleTheme();
    };
  }

  // Listen for OS system theme changes if user hasn't explicitly saved preference
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleOSThemeChange = (e) => {
    stateManager.setTheme(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handleOSThemeChange);
}

function applyThemeDOM(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    const isDark = theme === 'dark';
    toggleBtn.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    toggleBtn.setAttribute('title', `Current mode: ${theme}`);

    const sunIcon = toggleBtn.querySelector('.c-theme-icon--sun');
    const moonIcon = toggleBtn.querySelector('.c-theme-icon--moon');

    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'inline-block' : 'none';
      moonIcon.style.display = isDark ? 'none' : 'inline-block';
    }
  }
}
