import { stateManager, EVENTS } from './state.js';
import { eventBus } from './pubsub.js';

let pulseTimer = null;
let pubsubUnsubscribers = [];

export function initDashboardRenderer() {
  cleanupTimer();
  cleanupPubSub();

  const unsubData = eventBus.subscribe(EVENTS.DATA_HYDRATED, (payload) => {
    if (payload.metrics) {
      updateDashboardDOM(payload.metrics);
    }
  });

  const unsubMetrics = eventBus.subscribe(EVENTS.METRICS_UPDATED, ({ metrics }) => {
    updateDashboardDOM(metrics);
  });

  pubsubUnsubscribers.push(unsubData, unsubMetrics);

  const initialMetrics = stateManager.get('metrics');
  if (initialMetrics) {
    updateDashboardDOM(initialMetrics);
  }

  startSimulatedMetricsPulse();

  // Stop pulse when page is hidden to save resources and prevent memory degradation
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cleanupTimer();
    } else {
      startSimulatedMetricsPulse();
    }
  });
}

function cleanupPubSub() {
  pubsubUnsubscribers.forEach(unsub => unsub && unsub());
  pubsubUnsubscribers = [];
}

function cleanupTimer() {
  if (pulseTimer) {
    clearInterval(pulseTimer);
    pulseTimer = null;
  }
}

function startSimulatedMetricsPulse() {
  cleanupTimer();

  pulseTimer = setInterval(() => {
    const currentMetrics = stateManager.get('metrics');
    if (!currentMetrics || typeof currentMetrics.activeUsers !== 'number') return;

    const variation = Math.floor(Math.random() * 19) - 9;
    const newActiveUsers = Math.max(12000, currentMetrics.activeUsers + variation);

    stateManager.updateMetrics({ activeUsers: newActiveUsers });
  }, 3500);
}

function updateDashboardDOM(metrics) {
  const activeUsersElem = document.getElementById('metric-active-users');
  const conversionElem = document.getElementById('metric-conversion');
  const roiElem = document.getElementById('metric-roi');

  if (activeUsersElem && metrics.activeUsers !== undefined) {
    activeUsersElem.textContent = metrics.activeUsers.toLocaleString();
  }

  if (conversionElem && metrics.conversionRate !== undefined) {
    conversionElem.textContent = metrics.conversionRate;
  }

  if (roiElem && metrics.roi !== undefined) {
    roiElem.textContent = metrics.roi;
  }
}
