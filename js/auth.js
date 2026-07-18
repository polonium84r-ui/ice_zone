/**
 * auth.js — Authentication & session management (staff & admin only).
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

  async function logout() {
    await API.logout();
    currentSession = null;
  }

  function requireAdmin(redirectUrl = '/admin') {
    if (!isAdmin()) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  // Allows staff OR admin (POS billing). Redirects everyone else to the login.
  function requireStaff(redirectUrl = '/admin') {
    if (!canStaff()) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  return {
    init,
    getSession,
    getUser,
    isLoggedIn,
    isAdmin,
    isStaff,
    canStaff,
    login,
    logout,
    requireAdmin,
    requireStaff
  };
})();
