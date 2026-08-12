import { eventBus } from './pubsub.js';

export const EVENTS = {
  THEME_CHANGED: 'theme:changed',
  BILLING_CHANGED: 'billing:changed',
  CATEGORY_CHANGED: 'category:changed',
  SEARCH_CHANGED: 'search:changed',
  METRICS_UPDATED: 'metrics:updated',
  DATA_HYDRATED: 'data:hydrated',
  TOAST_NOTIFY: 'toast:notify'
};

const STORAGE_KEY = 'corporate_brand_state_v2';

class StateManager {
  constructor() {
    this.state = {
      theme: 'light',
      billingPeriod: 'monthly',
      activeCategory: 'all',
      searchQuery: '',
      metrics: {
        activeUsers: 14890,
        conversionRate: '4.82%',
        roi: '384%'
      },
      dataPayload: null
    };

    this.rehydrate();
  }

  /**
   * Rehydrate application state from localStorage safely
   */
  rehydrate() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state = {
          ...this.state,
          theme: parsed.theme || this.state.theme,
          billingPeriod: parsed.billingPeriod || this.state.billingPeriod,
          activeCategory: parsed.activeCategory || this.state.activeCategory
        };
      } else {
        // Fallback theme to OS preference if no stored key
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.state.theme = systemPrefersDark ? 'dark' : 'light';
      }
    } catch (e) {
      console.warn('[StateManager] Could not parse stored state from localStorage', e);
    }
  }

  /**
   * Persist current state to localStorage
   */
  persist() {
    try {
      const toPersist = {
        theme: this.state.theme,
        billingPeriod: this.state.billingPeriod,
        activeCategory: this.state.activeCategory
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    } catch (e) {
      console.error('[StateManager] Failed to write state to localStorage', e);
    }
  }

  /**
   * Get value for key or entire state copy
   */
  get(key) {
    if (!key) return { ...this.state };
    return this.state[key];
  }

  /**
   * Mutate theme state securely
   */
  setTheme(theme) {
    if (this.state.theme === theme) return;
    this.state.theme = theme;
    this.persist();
    eventBus.publish(EVENTS.THEME_CHANGED, { theme });
  }

  /**
   * Toggle theme state between light and dark
   */
  toggleTheme() {
    const nextTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  /**
   * Mutate billing period state ('monthly' | 'annual')
   */
  setBillingPeriod(period) {
    if (this.state.billingPeriod === period) return;
    this.state.billingPeriod = period;
    this.persist();
    eventBus.publish(EVENTS.BILLING_CHANGED, { billingPeriod: period });
  }

  /**
   * Mutate feature category filter
   */
  setActiveCategory(category) {
    if (this.state.activeCategory === category) return;
    this.state.activeCategory = category;
    this.persist();
    eventBus.publish(EVENTS.CATEGORY_CHANGED, { activeCategory: category });
  }

  /**
   * Mutate feature search query
   */
  setSearchQuery(query) {
    this.state.searchQuery = query;
    eventBus.publish(EVENTS.SEARCH_CHANGED, { searchQuery: query });
  }

  /**
   * Set dynamic payload after fetch
   */
  setDataPayload(payload) {
    this.state.dataPayload = payload;
    if (payload.metrics) {
      this.state.metrics = { ...this.state.metrics, ...payload.metrics };
    }
    eventBus.publish(EVENTS.DATA_HYDRATED, payload);
  }

  /**
   * Mutate live metric values securely
   */
  updateMetrics(partialMetrics) {
    this.state.metrics = { ...this.state.metrics, ...partialMetrics };
    eventBus.publish(EVENTS.METRICS_UPDATED, { metrics: this.state.metrics });
  }
}

export const stateManager = new StateManager();
