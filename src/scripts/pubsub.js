/**
 * PubSub (Publish-Subscribe) Custom Event Emitter Class
 * Decouples application state logic from DOM rendering.
 * Supports explicit subscribe/unsubscribe mechanics to prevent memory leaks.
 */
export class PubSub {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.events = new Map();
  }

  /**
   * Subscribe a handler to a specific event.
   * @param {string} event - Event name
   * @param {Function} callback - Event handler function
   * @returns {Function} Unsubscribe function handle for clean unmounting
   */
  subscribe(event, callback) {
    if (typeof callback !== 'function') {
      console.warn(`[PubSub] Subscriber callback for "${event}" must be a function.`);
      return () => {};
    }

    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const callbacks = this.events.get(event);
    callbacks.add(callback);

    // Return unbind handle to explicitly remove listener and prevent memory leaks
    return () => this.unsubscribe(event, callback);
  }

  /**
   * Unsubscribe a handler from an event.
   * @param {string} event - Event name
   * @param {Function} callback - Event handler function
   * @returns {boolean} True if removed, false if not found
   */
  unsubscribe(event, callback) {
    if (!this.events.has(event)) return false;

    const callbacks = this.events.get(event);
    const removed = callbacks.delete(callback);

    if (callbacks.size === 0) {
      this.events.delete(event);
    }

    return removed;
  }

  /**
   * Publish an event with optional data payload to all subscribers.
   * @param {string} event - Event name
   * @param {*} [data] - Event payload
   */
  publish(event, data = {}) {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[PubSub] Exception in subscriber for event "${event}":`, err);
      }
    });
  }

  /**
   * Clear subscribers for a specific event or all events.
   * @param {string} [event] - Optional target event to clear
   */
  clear(event = null) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

// Global Singleton Instance
export const eventBus = new PubSub();
