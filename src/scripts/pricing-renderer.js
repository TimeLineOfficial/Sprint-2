import { stateManager, EVENTS } from './state.js';
import { eventBus } from './pubsub.js';

let pricingListeners = [];
let pubsubUnsubscribers = [];

export function initPricingRenderer() {
  cleanupPubSub();

  const unsubData = eventBus.subscribe(EVENTS.DATA_HYDRATED, () => {
    renderPricing();
  });

  const unsubBilling = eventBus.subscribe(EVENTS.BILLING_CHANGED, ({ billingPeriod }) => {
    updatePricingToggleUI(billingPeriod);
    updatePricingValues(billingPeriod);
  });

  pubsubUnsubscribers.push(unsubData, unsubBilling);

  setupBillingToggleButtons();

  const payload = stateManager.get('dataPayload');
  if (payload) {
    renderPricing();
  }
}

function cleanupPubSub() {
  pubsubUnsubscribers.forEach(unsub => unsub && unsub());
  pubsubUnsubscribers = [];
}

function cleanupListeners() {
  pricingListeners.forEach(({ element, type, handler }) => {
    if (element && element.removeEventListener) {
      element.removeEventListener(type, handler);
    }
  });
  pricingListeners.length = 0;
}

function setupBillingToggleButtons() {
  const monthlyBtn = document.getElementById('pricing-monthly');
  const annualBtn = document.getElementById('pricing-annual');

  if (!monthlyBtn || !annualBtn) return;

  const currentBilling = stateManager.get('billingPeriod');
  updatePricingToggleUI(currentBilling);

  const handleMonthly = () => stateManager.setBillingPeriod('monthly');
  const handleAnnual = () => stateManager.setBillingPeriod('annual');

  monthlyBtn.addEventListener('click', handleMonthly);
  annualBtn.addEventListener('click', handleAnnual);

  pricingListeners.push(
    { element: monthlyBtn, type: 'click', handler: handleMonthly },
    { element: annualBtn, type: 'click', handler: handleAnnual }
  );
}

function updatePricingToggleUI(billingPeriod) {
  const monthlyBtn = document.getElementById('pricing-monthly');
  const annualBtn = document.getElementById('pricing-annual');

  if (!monthlyBtn || !annualBtn) return;

  const isAnnual = billingPeriod === 'annual';
  monthlyBtn.classList.toggle('c-pricing__toggle-btn--active', !isAnnual);
  annualBtn.classList.toggle('c-pricing__toggle-btn--active', isAnnual);
  monthlyBtn.setAttribute('aria-pressed', (!isAnnual).toString());
  annualBtn.setAttribute('aria-pressed', isAnnual.toString());
}

function renderPricing() {
  const container = document.getElementById('pricing-grid');
  if (!container) return;

  const payload = stateManager.get('dataPayload');
  if (!payload || !payload.pricing) return;

  container.innerHTML = '';
  const currentBilling = stateManager.get('billingPeriod');

  payload.pricing.forEach(tier => {
    const card = document.createElement('article');
    card.className = `c-pricing-card ${tier.isPopular ? 'c-pricing-card--popular' : ''}`;

    if (tier.isPopular && tier.badgeText) {
      const badge = document.createElement('div');
      badge.className = 'c-pricing-card__popular-badge';
      badge.textContent = tier.badgeText;
      card.appendChild(badge);
    }

    const title = document.createElement('h3');
    title.className = 'c-pricing-card__plan';
    title.textContent = tier.name;
    card.appendChild(title);

    // Price wrapper
    const priceWrap = document.createElement('div');
    priceWrap.className = 'c-pricing-card__price-wrapper';

    const curr = document.createElement('span');
    curr.className = 'c-pricing-card__currency';
    curr.textContent = '$';

    const amount = document.createElement('span');
    amount.className = 'c-pricing-card__amount';
    amount.textContent = currentBilling === 'annual' ? tier.annualPrice : tier.monthlyPrice;

    const period = document.createElement('span');
    period.className = 'c-pricing-card__period';
    period.textContent = currentBilling === 'annual' ? '/mo billed annually' : '/month';

    priceWrap.appendChild(curr);
    priceWrap.appendChild(amount);
    priceWrap.appendChild(period);
    card.appendChild(priceWrap);

    // Feature items list
    const featuresList = document.createElement('div');
    featuresList.className = 'c-pricing-card__features';

    tier.features.forEach(featText => {
      const item = document.createElement('div');
      item.className = 'c-pricing-card__feature-item';

      const checkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      checkIcon.setAttribute('class', 'c-pricing-card__check-icon');
      checkIcon.setAttribute('viewBox', '0 0 24 24');
      checkIcon.setAttribute('fill', 'none');
      checkIcon.setAttribute('stroke', 'currentColor');
      checkIcon.setAttribute('stroke-width', '3');
      checkIcon.innerHTML = `<polyline points="20 6 9 17 4 12"></polyline>`;

      const textSpan = document.createElement('span');
      textSpan.textContent = featText;

      item.appendChild(checkIcon);
      item.appendChild(textSpan);
      featuresList.appendChild(item);
    });

    card.appendChild(featuresList);

    // CTA Button
    const btn = document.createElement('button');
    btn.className = `c-btn c-btn--${tier.ctaVariant || 'primary'}`;
    btn.style.marginTop = 'auto';
    btn.textContent = tier.ctaText;

    const handleCtaClick = () => {
      eventBus.publish(EVENTS.TOAST_NOTIFY, {
        message: `Plan Selected: ${tier.name} (${currentBilling === 'annual' ? '$' + tier.annualPrice + '/mo' : '$' + tier.monthlyPrice + '/mo'})`,
        type: 'success'
      });
    };

    btn.addEventListener('click', handleCtaClick);
    pricingListeners.push({ element: btn, type: 'click', handler: handleCtaClick });

    card.appendChild(btn);
    container.appendChild(card);
  });
}

function updatePricingValues(billingPeriod) {
  const payload = stateManager.get('dataPayload');
  if (!payload || !payload.pricing) return;

  const amounts = document.querySelectorAll('.c-pricing-card__amount');
  const periods = document.querySelectorAll('.c-pricing-card__period');

  payload.pricing.forEach((tier, index) => {
    if (amounts[index]) {
      amounts[index].style.opacity = '0.3';
      setTimeout(() => {
        amounts[index].textContent = billingPeriod === 'annual' ? tier.annualPrice : tier.monthlyPrice;
        amounts[index].style.opacity = '1';
      }, 120);
    }
  });

  periods.forEach(el => {
    el.textContent = billingPeriod === 'annual' ? '/mo billed annually' : '/month';
  });
}
