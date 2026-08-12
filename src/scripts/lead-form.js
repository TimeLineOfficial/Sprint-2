import { eventBus } from './pubsub.js';
import { EVENTS } from './state.js';

let activeListeners = [];

export function initLeadForm() {
  destroyLeadFormListeners();

  setupModalOverlay();
  setupEmbeddedForm();
  setupTriggerButtons();
}

export function destroyLeadFormListeners() {
  activeListeners.forEach(({ element, type, handler }) => {
    if (element && element.removeEventListener) {
      element.removeEventListener(type, handler);
    }
  });
  activeListeners = [];
}

function setupTriggerButtons() {
  // Bind all CTA buttons with data-open-modal attribute or contact hrefs
  const triggerSelectors = [
    'a[href="#pricing"]',
    'a[href="#contact"]',
    '.c-pricing-card button',
    '[data-action="open-modal"]'
  ];

  const buttons = document.querySelectorAll(triggerSelectors.join(','));
  buttons.forEach(btn => {
    const handleTrigger = (e) => {
      // If clicking pricing buttons or contact CTAs, open modal dialog
      if (btn.classList.contains('c-btn--primary') || btn.classList.contains('c-btn--outline') || btn.getAttribute('href') === '#contact') {
        e.preventDefault();
        openLeadModal();
      }
    };

    btn.addEventListener('click', handleTrigger);
    activeListeners.push({ element: btn, type: 'click', handler: handleTrigger });
  });
}

function openLeadModal() {
  const overlay = document.getElementById('lead-modal-overlay');
  if (!overlay) return;

  overlay.classList.add('c-modal-overlay--open');
  document.body.style.overflow = 'hidden';

  // Focus first input field inside modal
  const firstInput = overlay.querySelector('input');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 150);
  }
}

export function closeLeadModal() {
  const overlay = document.getElementById('lead-modal-overlay');
  if (!overlay) return;

  overlay.classList.remove('c-modal-overlay--open');
  document.body.style.overflow = '';
}

function setupModalOverlay() {
  const overlay = document.getElementById('lead-modal-overlay');
  const closeBtn = document.getElementById('lead-modal-close');

  if (!overlay) return;

  // Close on close button click
  if (closeBtn) {
    const handleClose = (e) => {
      e.preventDefault();
      closeLeadModal();
    };
    closeBtn.addEventListener('click', handleClose);
    activeListeners.push({ element: closeBtn, type: 'click', handler: handleClose });
  }

  // Close on backdrop click outside modal box
  const handleBackdropClick = (e) => {
    if (e.target === overlay) {
      closeLeadModal();
    }
  };
  overlay.addEventListener('click', handleBackdropClick);
  activeListeners.push({ element: overlay, type: 'click', handler: handleBackdropClick });

  // Close on Escape key press
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('c-modal-overlay--open')) {
      closeLeadModal();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  activeListeners.push({ element: window, type: 'keydown', handler: handleKeyDown });

  // Form submit handler inside modal
  const modalForm = document.getElementById('lead-form-modal');
  if (modalForm) {
    const handleModalSubmit = (e) => {
      e.preventDefault();
      processFormSubmit(modalForm, true);
    };
    modalForm.addEventListener('submit', handleModalSubmit);
    activeListeners.push({ element: modalForm, type: 'submit', handler: handleModalSubmit });
  }
}

function setupEmbeddedForm() {
  const embeddedForm = document.getElementById('lead-form-embedded');
  if (!embeddedForm) return;

  const handleEmbeddedSubmit = (e) => {
    e.preventDefault();
    processFormSubmit(embeddedForm, false);
  };

  embeddedForm.addEventListener('submit', handleEmbeddedSubmit);
  activeListeners.push({ element: embeddedForm, type: 'submit', handler: handleEmbeddedSubmit });
}

function processFormSubmit(formElement, isModal) {
  const formData = new FormData(formElement);
  const data = {
    name: (formData.get('fullName') || '').toString().trim(),
    email: (formData.get('workEmail') || '').toString().trim(),
    company: (formData.get('companyName') || '').toString().trim(),
    scale: (formData.get('teamSize') || '').toString(),
    focus: (formData.get('projectScope') || '').toString(),
    message: (formData.get('requirements') || '').toString().trim(),
    submittedAt: new Date().toISOString()
  };

  if (!data.name || !data.email || !data.company) {
    eventBus.publish(EVENTS.TOAST_NOTIFY, {
      message: 'Please fill in all required fields (Name, Email, Company).',
      type: 'warning'
    });
    return;
  }

  // Save inquiry to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem('corporate_brand_leads') || '[]');
    existing.push(data);
    localStorage.setItem('corporate_brand_leads', JSON.stringify(existing));
  } catch (err) {
    console.warn('[LeadForm] LocalStorage save error', err);
  }

  // Notify user via PubSub Event Bus
  eventBus.publish(EVENTS.TOAST_NOTIFY, {
    message: `Thank you ${data.name}! Your enterprise inquiry has been submitted.`,
    type: 'success',
    duration: 5000
  });

  // Reset form and show success state UI
  formElement.reset();

  if (isModal) {
    closeLeadModal();
  } else {
    // Show inline thank you card inside embedded section
    const cardBody = formElement.parentElement;
    if (cardBody) {
      const successDiv = document.createElement('div');
      successDiv.className = 'c-form__success';
      successDiv.innerHTML = `
        <div class="c-form__success-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 class="c-lead-card__title">Inquiry Submitted Successfully</h3>
        <p class="c-lead-card__subtitle">Our Solutions Engineering team will reach out to <strong>${data.email}</strong> within 24 hours.</p>
        <button type="button" class="c-btn c-btn--outline c-btn--sm" id="reset-embedded-form" style="margin-top: 1rem;">Submit Another Inquiry</button>
      `;

      formElement.style.display = 'none';
      cardBody.appendChild(successDiv);

      const resetBtn = document.getElementById('reset-embedded-form');
      if (resetBtn) {
        resetBtn.onclick = () => {
          successDiv.remove();
          formElement.style.display = 'flex';
        };
      }
    }
  }
}
