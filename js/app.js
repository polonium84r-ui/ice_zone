/**
 * app.js — Shared UI utilities, navbar, toasts, scroll effects
 */

const App = (() => {
  /* --- HTML escaping (prevents markup in dynamic values from being parsed) --- */
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* --- Toast System --- */
  function showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /* --- Currency Formatting --- */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /* --- Navbar --- */
  function initNavbar(options = {}) {
    const { transparent = false, activePage = '' } = options;
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    if (transparent) {
      navbar.classList.add('transparent');
    } else {
      navbar.classList.add('solid', 'scrolled');
    }

    window.addEventListener('scroll', () => {
      if (transparent) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        navbar.classList.toggle('transparent', window.scrollY <= 50);
      }
    });

    const links = navbar.querySelectorAll('.nav-links a, .mobile-drawer a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && activePage && href.includes(activePage)) {
        link.classList.add('active');
      }
    });

    initHamburger();
  }

  function initHamburger() {
    const hamburger = document.querySelector('.hamburger');
    const drawer = document.querySelector('.mobile-drawer');
    const overlay = document.querySelector('.mobile-drawer-overlay');
    if (!hamburger || !drawer) return;

    function toggle() {
      hamburger.classList.toggle('active');
      drawer.classList.toggle('open');
      overlay?.classList.toggle('open');
      document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
    }

    hamburger.addEventListener('click', toggle);
    overlay?.addEventListener('click', toggle);
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', toggle));
  }

  /* --- Scroll Reveal --- */
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal:not(.visible)');
    if (!reveals.length) return;

    const reveal = el => el.classList.add('visible');

    // Reduced-motion or no IntersectionObserver: show everything immediately.
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveals.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));

    // Fail-safe: content must never stay hidden if the observer misses an
    // element (fast scroll, long lists, background tabs). Reveal any stragglers.
    setTimeout(() => reveals.forEach(reveal), 2000);
  }

  /* --- Promo Carousel --- */
  function initPromoCarousel() {
    const items = document.querySelectorAll('.promo-item');
    if (items.length < 2) return;

    let current = 0;
    setInterval(() => {
      items[current].classList.remove('active');
      current = (current + 1) % items.length;
      items[current].classList.add('active');
    }, 4000);
  }

  /* --- Lazy Load Images --- */
  function initLazyImages() {
    const images = document.querySelectorAll('img[data-src]');
    if (!images.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.addEventListener('error', () => {
            img.src = 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&q=80';
            img.alt = 'Food image';
          });
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '100px' });

    images.forEach(img => {
      img.classList.add('skeleton');
      img.addEventListener('load', () => img.classList.remove('skeleton'));
      observer.observe(img);
    });
  }

  /* --- Form Validation --- */
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone) {
    return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
  }

  function validatePassword(password) {
    return password.length >= 6;
  }

  function showFieldError(input, message) {
    input.classList.add('error');
    const errorEl = input.parentElement.querySelector('.form-error') ||
      input.closest('.form-group')?.querySelector('.form-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  function clearFieldError(input) {
    input.classList.remove('error');
    const errorEl = input.parentElement.querySelector('.form-error') ||
      input.closest('.form-group')?.querySelector('.form-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  function setupFieldValidation(form) {
    const inputs = form.querySelectorAll('.form-control[data-validate]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
    });
  }

  function validateField(input) {
    const type = input.dataset.validate;
    const value = input.value.trim();
    clearFieldError(input);

    if (input.required && !value) {
      showFieldError(input, 'This field is required');
      return false;
    }

    switch (type) {
      case 'email':
        if (value && !validateEmail(value)) {
          showFieldError(input, 'Please enter a valid email address');
          return false;
        }
        break;
      case 'password':
        if (value && !validatePassword(value)) {
          showFieldError(input, 'Password must be at least 6 characters');
          return false;
        }
        break;
      case 'phone':
        if (value && !validatePhone(value)) {
          showFieldError(input, 'Please enter a valid 10-digit phone number');
          return false;
        }
        break;
      case 'pincode':
        if (value && !/^\d{6}$/.test(value)) {
          showFieldError(input, 'Please enter a valid 6-digit pincode');
          return false;
        }
        break;
      case 'confirm-password': {
        const form = input.closest('form');
        const password = form ? form.querySelector('[data-validate="password"]') : document.querySelector('[data-validate="password"]');
        if (value && password && value !== password.value) {
          showFieldError(input, 'Passwords do not match');
          return false;
        }
        break;
      }
    }
    return true;
  }

  /* --- Modal Helpers --- */
  function openModal(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function initModals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
      overlay.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
          overlay.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    });
  }

  /* --- Render Dish Card (display-only showcase) --- */
  function renderDishCard(item, options = {}) {
    const { compact = false } = options;
    const name = escapeHtml(item.name);
    return `
      <div class="dish-card reveal" data-id="${Number(item.id)}">
        <div class="dish-card-image">
          <img src="${escapeHtml(item.image)}" alt="${name}" loading="lazy"
            onerror="this.onerror=null;this.src='assets/hero.jpg'">
        </div>
        <div class="dish-card-body">
          <div class="dish-card-header">
            <h3>${name}</h3>
            <span class="veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}" title="${item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}"></span>
          </div>
          ${!compact ? `<p class="dish-desc">${escapeHtml(item.description)}</p>` : ''}
          <div class="dish-rating">
            <span class="star">★</span> ${Number(item.rating)}
            <span class="count">(${Number(item.reviewCount)})</span>
          </div>
          <div class="dish-footer">
            <span class="dish-price">${formatCurrency(item.price)}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Cards are informational — clicking one opens the read-only detail view.
  function bindDishCardEvents(container, menuItems) {
    container.querySelectorAll('.dish-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        const item = menuItems.find(m => m.id === id);
        if (item && typeof openDishDetail === 'function') openDishDetail(item);
      });
    });
  }

  /* --- Count Up Animation --- */
  function animateCountUp(element, targetValue, prefix = '₹') {
    const start = parseFloat(element.dataset.value || '0');
    const duration = 400;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (targetValue - start) * eased;
      element.textContent = prefix === '₹' ? formatCurrency(current) : Math.round(current);
      element.dataset.value = current;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  /* --- Global Init --- */
  async function init(options = {}) {
    await Auth.init();
    initNavbar(options);
    initScrollReveal();
    initLazyImages();
    initModals();
    initPromoCarousel();
  }

  return {
    escapeHtml,
    showToast,
    formatCurrency,
    initNavbar,
    initScrollReveal,
    initPromoCarousel,
    initLazyImages,
    validateEmail,
    validatePhone,
    validatePassword,
    showFieldError,
    clearFieldError,
    setupFieldValidation,
    validateField,
    openModal,
    closeModal,
    initModals,
    renderDishCard,
    bindDishCardEvents,
    animateCountUp,
    init
  };
})();
