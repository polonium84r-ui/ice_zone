/**
 * auth.js — Authentication & session management
 */

const Auth = (() => {
  let currentSession = null;

  async function init() {
    currentSession = await API.getSession();
    return currentSession;
  }

  function getSession() {
    return currentSession;
  }

  function getUser() {
    return currentSession?.user || null;
  }

  function isLoggedIn() {
    return !!currentSession?.token;
  }

  function isAdmin() {
    return currentSession?.user?.role === 'admin';
  }

  function isCustomer() {
    return currentSession?.user?.role === 'customer';
  }

  function isStaff() {
    return currentSession?.user?.role === 'staff';
  }

  // Staff-capable = staff or admin (admin can do everything staff can)
  function canStaff() {
    const role = currentSession?.user?.role;
    return role === 'staff' || role === 'admin';
  }

  async function login(email, password) {
    const session = await API.login(email, password);
    currentSession = session;
    return session;
  }

  async function register(userData) {
    const session = await API.register(userData);
    currentSession = session;
    return session;
  }

  async function logout() {
    await API.logout();
    currentSession = null;
  }

  function requireAuth(redirectUrl = 'login.html') {
    if (!isLoggedIn()) {
      window.location.href = redirectUrl + '?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  }

  function requireAdmin(redirectUrl = 'login.html') {
    if (!isAdmin()) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  function requireCustomer(redirectUrl = 'login.html') {
    if (!isCustomer()) {
      window.location.href = redirectUrl + '?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  }

  // Allows staff OR admin (POS billing). Redirects everyone else to login.
  function requireStaff(redirectUrl = 'login.html') {
    if (!canStaff()) {
      window.location.href = redirectUrl + '?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  }

  function getRewardPoints() {
    return currentSession?.user?.rewardPoints || 0;
  }

  async function refreshSession() {
    currentSession = await API.getSession();
    return currentSession;
  }

  return {
    init,
    getSession,
    getUser,
    isLoggedIn,
    isAdmin,
    isCustomer,
    isStaff,
    canStaff,
    login,
    register,
    logout,
    requireAuth,
    requireAdmin,
    requireCustomer,
    requireStaff,
    getRewardPoints,
    refreshSession
  };
})();
