import { eventBus } from './pubsub.js';
import { EVENTS } from './state.js';

let container = null;
let activeToastTimeouts = [];

export function initToastRenderer() {
  ensureContainer();

  eventBus.subscribe(EVENTS.TOAST_NOTIFY, ({ message, type = 'info', duration = 3500 }) => {
    showToast(message, type, duration);
  });
}

function ensureContainer() {
  container = document.getElementById('c-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'c-toast-container';
    container.className = 'c-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }
}

function showToast(message, type = 'info', duration = 3500) {
  ensureContainer();

  const toast = document.createElement('div');
  toast.className = `c-toast c-toast--${type}`;

  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('class', 'c-toast__icon');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('fill', 'none');
  iconSvg.setAttribute('stroke', 'currentColor');
  iconSvg.setAttribute('stroke-width', '2.5');
  iconSvg.innerHTML = type === 'success' 
    ? `<polyline points="20 6 9 17 4 12"></polyline>` 
    : `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>`;

  const msgSpan = document.createElement('span');
  msgSpan.className = 'c-toast__message';
  msgSpan.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'c-toast__close';
  closeBtn.setAttribute('aria-label', 'Close notification');
  closeBtn.innerHTML = `&times;`;

  const dismiss = () => {
    toast.classList.add('c-toast--hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  };

  closeBtn.addEventListener('click', dismiss);
  toast.appendChild(iconSvg);
  toast.appendChild(msgSpan);
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  const timeoutId = setTimeout(dismiss, duration);
  activeToastTimeouts.push(timeoutId);
}
