/**
 * cart.js ΓÇö Cart management & order calculations
 */

const Cart = (() => {
  let items = [];
  let menuCache = [];

  const DELIVERY_OPTIONS = {
    standard: { label: 'Standard Delivery', time: '45 min', fee: null },
    express: { label: 'Express Delivery', time: '25 min', fee: 30 },
    pickup: { label: 'Dine-in / Pickup', time: 'Ready in 20 min', fee: 0 }
  };

  const PLATFORM_FEE = 5;
  const GST_RATE = 0.05;
  const FREE_DELIVERY_THRESHOLD = 499;
  const STANDARD_DELIVERY_FEE = 40;

  async function init() {
    items = await API.getCart();
    menuCache = await API.getMenu();
    return items;
  }

  function getItems() {
    return items;
  }

  function getCount() {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  async function addItem(dishId, quantity = 1) {
    const existing = items.find(i => i.id === dishId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ id: dishId, quantity });
    }
    await API.saveCart(items);
    App.updateCartBadge();
    return items;
  }

  async function updateQuantity(dishId, quantity) {
    const item = items.find(i => i.id === dishId);
    if (!item) return items;
    if (quantity <= 0) {
      return removeItem(dishId);
    }
    item.quantity = quantity;
    await API.saveCart(items);
    App.updateCartBadge();
    return items;
  }

  async function removeItem(dishId) {
    items = items.filter(i => i.id !== dishId);
    await API.saveCart(items);
    App.updateCartBadge();
    return items;
  }

  async function clear() {
    items = [];
    await API.saveCart(items);
    App.updateCartBadge();
    return items;
  }

  function getSubtotal() {
    return items.reduce((sum, ci) => {
      const menuItem = menuCache.find(m => m.id === ci.id);
      return sum + (menuItem ? menuItem.price * ci.quantity : 0);
    }, 0);
  }

  function getDeliveryFee(deliveryOption, subtotal) {
    if (deliveryOption === 'pickup') return 0;
    if (deliveryOption === 'express') {
      const base = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
      return base + DELIVERY_OPTIONS.express.fee;
    }
    return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  }

  function calculateTotals(options = {}) {
    const {
      couponDiscount = 0,
      pointsRedeemed = 0,
      deliveryOption = 'standard'
    } = options;

    const subtotal = getSubtotal();
    const deliveryFee = getDeliveryFee(deliveryOption, subtotal);
    const platformFee = items.length > 0 ? PLATFORM_FEE : 0;
    const taxableAmount = subtotal + deliveryFee + platformFee - couponDiscount - pointsRedeemed;
    const gst = Math.max(0, taxableAmount * GST_RATE);
    const grandTotal = Math.max(0, taxableAmount + gst);

    return {
      subtotal,
      deliveryFee,
      platformFee,
      couponDiscount,
      pointsRedeemed,
      gst: Math.round(gst * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      itemCount: getCount()
    };
  }

  function getMaxRedeemablePoints(subtotal, couponDiscount = 0) {
    const user = Auth.getUser();
    if (!user) return 0;
    const balance = user.rewardPoints || 0;
    const billBeforePoints = subtotal - couponDiscount;
    const maxByBill = Math.floor(billBeforePoints * 0.5);
    return Math.min(balance, maxByBill);
  }

  function getMenuItem(dishId) {
    return menuCache.find(m => m.id === dishId);
  }

  async function refreshMenu() {
    menuCache = await API.getMenu();
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  return {
    DELIVERY_OPTIONS,
    PLATFORM_FEE,
    GST_RATE,
    FREE_DELIVERY_THRESHOLD,
    STANDARD_DELIVERY_FEE,
    init,
    getItems,
    getCount,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    getSubtotal,
    getDeliveryFee,
    calculateTotals,
    getMaxRedeemablePoints,
    getMenuItem,
    refreshMenu,
    formatCurrency
  };
})();
