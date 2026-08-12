import { stateManager, EVENTS } from './state.js';
import { eventBus } from './pubsub.js';

let cardListeners = [];
let categoryListeners = [];
let pubsubUnsubscribers = [];

const ICON_MAP = {
  zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>`,
  globe: `<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>`,
  shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>`,
  monitor: `<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>`,
  moon: `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`,
  code: `<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>`
};

export function initFeaturesRenderer() {
  cleanupPubSub();

  const unsubData = eventBus.subscribe(EVENTS.DATA_HYDRATED, (payload) => {
    renderCategoryFilter(payload.categories || []);
    renderFeatures();
  });

  const unsubCategory = eventBus.subscribe(EVENTS.CATEGORY_CHANGED, () => {
    updateActiveCategoryButton();
    renderFeatures();
  });

  const unsubSearch = eventBus.subscribe(EVENTS.SEARCH_CHANGED, () => {
    renderFeatures();
  });

  pubsubUnsubscribers.push(unsubData, unsubCategory, unsubSearch);

  // Initial render if data already present
  const payload = stateManager.get('dataPayload');
  if (payload) {
    renderCategoryFilter(payload.categories || []);
    renderFeatures();
  }
}

function cleanupPubSub() {
  pubsubUnsubscribers.forEach(unsub => unsub && unsub());
  pubsubUnsubscribers = [];
}

function cleanupListeners(listenerArray) {
  listenerArray.forEach(({ element, type, handler }) => {
    if (element && element.removeEventListener) {
      element.removeEventListener(type, handler);
    }
  });
  listenerArray.length = 0;
}

function renderCategoryFilter(categories) {
  const container = document.getElementById('features-filter-container');
  if (!container) return;

  cleanupListeners(categoryListeners);
  container.innerHTML = '';

  const activeCat = stateManager.get('activeCategory');

  // Filter Bar Wrapper
  const bar = document.createElement('div');
  bar.className = 'c-filter-bar';

  // Category Pills Group
  const group = document.createElement('div');
  group.className = 'c-filter-bar__group';
  group.setAttribute('role', 'tablist');

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `c-filter-bar__pill ${cat.id === activeCat ? 'c-filter-bar__pill--active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', (cat.id === activeCat).toString());
    btn.setAttribute('data-category', cat.id);
    btn.textContent = cat.label;

    const handleClick = () => {
      stateManager.setActiveCategory(cat.id);
    };

    btn.addEventListener('click', handleClick);
    categoryListeners.push({ element: btn, type: 'click', handler: handleClick });

    group.appendChild(btn);
  });

  // Search Input Box
  const searchWrap = document.createElement('div');
  searchWrap.className = 'c-filter-bar__search-wrap';

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'c-filter-bar__search-input';
  searchInput.placeholder = 'Search architecture modules...';
  searchInput.value = stateManager.get('searchQuery') || '';
  searchInput.setAttribute('aria-label', 'Search architecture modules');

  const handleInput = (e) => {
    stateManager.setSearchQuery(e.target.value.trim().toLowerCase());
  };

  searchInput.addEventListener('input', handleInput);
  categoryListeners.push({ element: searchInput, type: 'input', handler: handleInput });

  searchWrap.appendChild(searchInput);
  bar.appendChild(group);
  bar.appendChild(searchWrap);
  container.appendChild(bar);
}

function updateActiveCategoryButton() {
  const activeCat = stateManager.get('activeCategory');
  const pills = document.querySelectorAll('.c-filter-bar__pill');
  pills.forEach(pill => {
    const isTarget = pill.getAttribute('data-category') === activeCat;
    pill.classList.toggle('c-filter-bar__pill--active', isTarget);
    pill.setAttribute('aria-selected', isTarget.toString());
  });
}

function renderFeatures() {
  const gridContainer = document.getElementById('features-grid');
  if (!gridContainer) return;

  const payload = stateManager.get('dataPayload');
  if (!payload || !payload.features) return;

  cleanupListeners(cardListeners);
  gridContainer.innerHTML = '';

  const activeCategory = stateManager.get('activeCategory');
  const searchQuery = stateManager.get('searchQuery');

  // Filter feature cards dynamically
  const filtered = payload.features.filter(feat => {
    const matchesCategory = activeCategory === 'all' || feat.category === activeCategory;
    const matchesSearch = !searchQuery || 
      feat.title.toLowerCase().includes(searchQuery) || 
      feat.description.toLowerCase().includes(searchQuery) ||
      feat.badge.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'c-features__empty';
    emptyState.textContent = 'No matching architecture features found.';
    gridContainer.appendChild(emptyState);
    return;
  }

  filtered.forEach(feat => {
    const card = document.createElement('article');
    card.className = 'c-card';
    card.setAttribute('data-id', feat.id);

    // Icon container
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'c-card__icon-wrapper';
    
    const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgIcon.setAttribute('class', 'c-card__icon');
    svgIcon.setAttribute('viewBox', '0 0 24 24');
    svgIcon.setAttribute('fill', 'none');
    svgIcon.setAttribute('stroke', 'currentColor');
    svgIcon.setAttribute('stroke-width', '2');
    svgIcon.setAttribute('stroke-linecap', 'round');
    svgIcon.setAttribute('stroke-linejoin', 'round');
    svgIcon.innerHTML = ICON_MAP[feat.icon] || ICON_MAP.zap;

    iconWrapper.appendChild(svgIcon);

    // Title (secure textContent)
    const title = document.createElement('h3');
    title.className = 'c-card__title';
    title.textContent = feat.title;

    // Description (secure textContent)
    const desc = document.createElement('p');
    desc.className = 'c-card__description';
    desc.textContent = feat.description;

    // Card Footer Link & Badge
    const footerWrap = document.createElement('div');
    footerWrap.className = 'c-card__footer';

    const badge = document.createElement('span');
    badge.className = 'c-card__badge';
    badge.textContent = feat.badge;

    const link = document.createElement('button');
    link.className = 'c-card__link';
    link.type = 'button';
    
    const linkSpan = document.createElement('span');
    linkSpan.textContent = 'Explore Module';

    const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowSvg.setAttribute('width', '16');
    arrowSvg.setAttribute('height', '16');
    arrowSvg.setAttribute('viewBox', '0 0 24 24');
    arrowSvg.setAttribute('fill', 'none');
    arrowSvg.setAttribute('stroke', 'currentColor');
    arrowSvg.setAttribute('stroke-width', '2');
    arrowSvg.innerHTML = `<polyline points="9 18 15 12 9 6"></polyline>`;

    link.appendChild(linkSpan);
    link.appendChild(arrowSvg);

    const handleLinkClick = (e) => {
      e.preventDefault();
      eventBus.publish(EVENTS.TOAST_NOTIFY, {
        message: `Inspecting ${feat.title} architecture module.`,
        type: 'info'
      });
    };

    link.addEventListener('click', handleLinkClick);
    cardListeners.push({ element: link, type: 'click', handler: handleLinkClick });

    footerWrap.appendChild(badge);
    footerWrap.appendChild(link);

    card.appendChild(iconWrapper);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(footerWrap);

    gridContainer.appendChild(card);
  });
}
