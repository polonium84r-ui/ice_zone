/**
 * app.js — Shared UI utilities, navbar, toasts, scroll effects
 */

const App = (() => {
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
    updateAuthUI();
    updateCartBadge();
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

  function updateAuthUI() {
    const loginLink = document.querySelector('.nav-login-link');
    const userMenu = document.querySelector('.user-menu');
    const drawerLoginLink = document.querySelector('.mobile-drawer a[href="login.html"]');
    // Any other "Login" call-to-action (e.g. the homepage hero button).
    const loginCtas = document.querySelectorAll('.js-login-cta');
    if (!loginLink && !userMenu && !loginCtas.length) return;

    const user = Auth.getUser();
    if (user) {
      if (loginLink) loginLink.style.display = 'none';
      if (drawerLoginLink) drawerLoginLink.style.display = 'none';
      loginCtas.forEach(el => el.style.display = 'none');
      if (userMenu) {
        userMenu.style.display = 'block';
        const btn = userMenu.querySelector('.user-menu-btn');
        if (btn) btn.innerHTML = `Hi, ${user.name.split(' ')[0]} <span>▾</span>`;

        const logoutBtn = userMenu.querySelector('.logout-btn');
        if (logoutBtn) {
          logoutBtn.onclick = async (e) => {
            e.preventDefault();
            await Auth.logout();
            showToast('Logged out successfully', 'success');
            setTimeout(() => window.location.href = 'index.html', 500);
          };
        }

        const menuBtn = userMenu.querySelector('.user-menu-btn');
        const dropdown = userMenu.querySelector('.user-dropdown');
        if (menuBtn && dropdown) {
          menuBtn.onclick = () => dropdown.classList.toggle('open');
          document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) dropdown.classList.remove('open');
          });
        }
      }
    } else {
      if (loginLink) loginLink.style.display = '';
      if (drawerLoginLink) drawerLoginLink.style.display = '';
      loginCtas.forEach(el => el.style.display = '');
      if (userMenu) userMenu.style.display = 'none';
    }
  }

  function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = Cart.getCount();
    badges.forEach(badge => {
      const prev = parseInt(badge.textContent) || 0;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
      if (count > prev) {
        badge.classList.add('bounce');
        setTimeout(() => badge.classList.remove('bounce'), 500);
      }
    });
  }

  /* --- Scroll Reveal --- */
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
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

  /* --- Fly to Cart Animation --- */
  function flyToCart(sourceEl) {
    const cartBtn = document.querySelector('.cart-btn');
    if (!cartBtn || !sourceEl) return;

    const sourceRect = sourceEl.getBoundingClientRect();
    const cartRect = cartBtn.getBoundingClientRect();

    const fly = document.createElement('div');
    fly.className = 'fly-item';
    fly.style.background = 'var(--color-primary)';
    fly.style.left = sourceRect.left + sourceRect.width / 2 - 20 + 'px';
    fly.style.top = sourceRect.top + sourceRect.height / 2 - 20 + 'px';
    document.body.appendChild(fly);

    requestAnimationFrame(() => {
      fly.style.left = cartRect.left + cartRect.width / 2 - 20 + 'px';
      fly.style.top = cartRect.top + cartRect.height / 2 - 20 + 'px';
      fly.style.transform = 'scale(0.3)';
      fly.style.opacity = '0.5';
    });

    setTimeout(() => fly.remove(), 600);
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

  /* --- Render Dish Card --- */
  function renderDishCard(item, options = {}) {
    const { showStepper = true, compact = false } = options;
    const cartItem = Cart.getItems().find(ci => ci.id === item.id);
    const qty = cartItem?.quantity || 0;

    return `
      <div class="dish-card reveal" data-id="${item.id}">
        <div class="dish-card-image">
          <img src="${item.image}" alt="${item.name}" loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&q=80'">
        </div>
        <div class="dish-card-body">
          <div class="dish-card-header">
            <h3>${item.name}</h3>
            <span class="veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}" title="${item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}"></span>
          </div>
          ${!compact ? `<p class="dish-desc">${item.description}</p>` : ''}
          <div class="dish-rating">
            <span class="star">★</span> ${item.rating}
            <span class="count">(${item.reviewCount})</span>
          </div>
          <div class="dish-footer">
            <span class="dish-price">${formatCurrency(item.price)}</span>
            ${showStepper ? `
              <div class="dish-actions" data-id="${item.id}">
                ${qty > 0 ? `
                  <div class="qty-stepper">
                    <button class="qty-minus" aria-label="Decrease quantity">−</button>
                    <span>${qty}</span>
                    <button class="qty-plus" aria-label="Increase quantity">+</button>
                  </div>
                ` : `
                  <button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${item.id}">Add</button>
                `}
              </div>
            ` : `
              <button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${item.id}">Add to Cart</button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function bindDishCardEvents(container, menuItems) {
    container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        await Cart.addItem(id, 1);
        App.flyToCart(btn);
        App.showToast('Added to cart!', 'success');
        const card = btn.closest('.dish-card');
        if (card) {
          const item = menuItems.find(m => m.id === id);
          if (item) {
            const actions = card.querySelector('.dish-actions');
            if (actions) {
              actions.innerHTML = `
                <div class="qty-stepper">
                  <button class="qty-minus" aria-label="Decrease quantity">−</button>
                  <span>1</span>
                  <button class="qty-plus" aria-label="Increase quantity">+</button>
                </div>
              `;
              bindStepper(actions, id, menuItems, container);
            }
          }
        }
      });
    });

    container.querySelectorAll('.qty-stepper').forEach(stepper => {
      const card = stepper.closest('.dish-card');
      const id = parseInt(card?.dataset.id);
      if (id) bindStepper(stepper.parentElement, id, menuItems, container);
    });

    container.querySelectorAll('.dish-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const id = parseInt(card.dataset.id);
        const item = menuItems.find(m => m.id === id);
        if (item && typeof openDishDetail === 'function') openDishDetail(item);
      });
    });
  }

  function bindStepper(actionsEl, dishId, menuItems, container) {
    const minus = actionsEl.querySelector('.qty-minus');
    const plus = actionsEl.querySelector('.qty-plus');
    const span = actionsEl.querySelector('.qty-stepper span');

    minus?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const cartItem = Cart.getItems().find(ci => ci.id === dishId);
      const newQty = (cartItem?.quantity || 0) - 1;
      await Cart.updateQuantity(dishId, newQty);
      if (newQty <= 0) {
        const card = actionsEl.closest('.dish-card');
        if (card) {
          actionsEl.innerHTML = `<button class="btn btn-primary btn-sm add-to-cart-btn" data-id="${dishId}">Add</button>`;
          bindDishCardEvents(container || card.parentElement, menuItems);
        }
      } else if (span) {
        span.textContent = newQty;
      }
    });

    plus?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const cartItem = Cart.getItems().find(ci => ci.id === dishId);
      const newQty = (cartItem?.quantity || 0) + 1;
      await Cart.updateQuantity(dishId, newQty);
      if (span) span.textContent = newQty;
      App.flyToCart(plus);
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
    API.initStorage();
    await Auth.init();
    await Cart.init();
    initNavbar(options);
    initScrollReveal();
    initLazyImages();
    initModals();
    initPromoCarousel();
  }

  return {
    showToast,
    formatCurrency,
    initNavbar,
    updateAuthUI,
    updateCartBadge,
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
    flyToCart,
    openModal,
    closeModal,
    initModals,
    renderDishCard,
    bindDishCardEvents,
    bindStepper,
    animateCountUp,
    init
  };
})();
