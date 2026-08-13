/**
 * Navigation & Mobile Hamburger Menu Controller
 * Ensures clean lifecycle management, immediate menu closure on link click, and zero memory leaks.
 */

let activeListeners = [];

export function initNavigation() {
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  // Clean previous event listeners if re-initialized
  destroyNavigationListeners();

  if (!navToggle || !navMenu) return;

  function toggleMenu(forceState) {
    const isCurrentlyOpen = navMenu.classList.contains('c-nav__menu--open');
    const nextState = forceState !== undefined ? forceState : !isCurrentlyOpen;

    navMenu.classList.toggle('c-nav__menu--open', nextState);
    navToggle.setAttribute('aria-expanded', nextState.toString());
    
    // Prevent background body scroll when mobile menu is open
    if (window.innerWidth < 768) {
      document.body.style.overflow = nextState ? 'hidden' : '';
    }
  }

  const handleToggleClick = (e) => {
    e.stopPropagation();
    toggleMenu();
  };

  navToggle.addEventListener('click', handleToggleClick);
  activeListeners.push({ element: navToggle, type: 'click', handler: handleToggleClick });

  // Close menu immediately when clicking ANY link or button inside the navigation drawer
  const allDrawerLinks = navMenu.querySelectorAll('a, button');
  allDrawerLinks.forEach(link => {
    const handleLinkClick = () => {
      if (window.innerWidth < 768) {
        toggleMenu(false); // Force close menu on phone view
      }
    };
    link.addEventListener('click', handleLinkClick);
    activeListeners.push({ element: link, type: 'click', handler: handleLinkClick });
  });

  // Handle window resize cleanly
  const handleResize = () => {
    if (window.innerWidth >= 768) {
      navMenu.classList.remove('c-nav__menu--open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  };

  window.addEventListener('resize', handleResize);
  activeListeners.push({ element: window, type: 'resize', handler: handleResize });
}

export function destroyNavigationListeners() {
  activeListeners.forEach(({ element, type, handler }) => {
    if (element && element.removeEventListener) {
      element.removeEventListener(type, handler);
    }
  });
  activeListeners = [];
}
