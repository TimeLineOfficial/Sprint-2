import { stateManager, EVENTS } from './state.js';
import { eventBus } from './pubsub.js';
import { initTheme } from './theme.js';
import { initNavigation } from './navigation.js';
import { initFeaturesRenderer } from './features-renderer.js';
import { initPricingRenderer } from './pricing-renderer.js';
import { initDashboardRenderer } from './dashboard-renderer.js';
import { initToastRenderer } from './toast-renderer.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize core system modules & PubSub subscribers
  initTheme();
  initNavigation();
  initToastRenderer();
  initFeaturesRenderer();
  initPricingRenderer();
  initDashboardRenderer();
  setupNewsletterForm();

  // 2. Hydrate dynamic payload from JSON (with fallbacks for root & dist deployments)
  try {
    let response = await fetch('./data/landing-data.json');
    if (!response.ok) {
      response = await fetch('./public/data/landing-data.json');
    }
    if (!response.ok) {
      throw new Error(`Failed to load landing-data.json (Status: ${response.status})`);
    }
    const data = await response.json();
    stateManager.setDataPayload(data);

    console.log('🚀 [Sprint 2] Corporate Brand Landing Page rehydrated from dynamic JSON payload via PubSub Event Bus!');
  } catch (err) {
    console.error('❌ Error fetching landing page payload:', err);
    eventBus.publish(EVENTS.TOAST_NOTIFY, {
      message: 'Notice: Using fallback static state. JSON payload fetch failed.',
      type: 'warning'
    });
  }
});

function setupNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  const input = document.getElementById('newsletter-email');

  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (email && email.includes('@')) {
      eventBus.publish(EVENTS.TOAST_NOTIFY, {
        message: `Subscription confirmed! Architecture updates will be sent to ${email}`,
        type: 'success'
      });
      input.value = '';
    } else {
      eventBus.publish(EVENTS.TOAST_NOTIFY, {
        message: 'Please enter a valid work email address.',
        type: 'warning'
      });
    }
  });
}
