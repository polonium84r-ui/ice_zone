/**
 * api.js — Data access layer for the Thirst. frontend.
 * Talks to the Node/Express + SQLite backend over REST (JWT auth).
 * Only the staff/admin session token is kept in localStorage; everything
 * else is persisted server-side. There is no customer role.
 */

const API = (() => {
  // Backend origin resolution order:
  //  1. window.THIRST_API  — injected at build / deploy time
  //  2. Same-origin        — when the Express server is also serving the frontend (local dev)
  //  3. Render production  — the deployed API service URL
  const RENDER_API = 'https://ice-zone.onrender.com';
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const BACKEND = (window.THIRST_API || (isLocal ? 'http://localhost:4000' : RENDER_API)).replace(/\/$/, '');
  const sameOrigin = location.origin === BACKEND;
  const BASE = (sameOrigin ? '' : BACKEND) + '/api/v1';

  // Only the staff/admin session lives client-side.
  const STORAGE_KEYS = {
    SESSION: 'ps_session'
  };

  /* ---------- storage helpers (session only) ---------- */
  function getStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch { return fallback; }
  }
  function setStorage(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

  function getToken() {
    const session = getStorage(STORAGE_KEYS.SESSION, null);
    return session && session.token ? session.token : null;
  }

  /* ---------- fetch wrapper ---------- */
  async function request(pathname, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = getToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;
    }
    let res;
    try {
      res = await fetch(BASE + pathname, {
        method, headers, body: body != null ? JSON.stringify(body) : undefined
      });
    } catch {
      throw new Error('Cannot reach the server. Please make sure the backend is running.');
    }
    let data = null;
    const text = await res.text();
    if (text) { try { data = JSON.parse(text); } catch { data = text; } }
    if (!res.ok) {
      const msg = data && data.error ? data.error : ('Request failed (' + res.status + ')');
      throw new Error(msg);
    }
    return data;
  }

  /* ---------- Menu ---------- */
  async function getMenu() { return request('/menu'); }
  async function getAllMenuItems() { return request('/menu/all', { auth: true }); }
  async function getMenuItem(id) { return request('/menu/' + id); }
  async function addMenuItem(item) { return request('/menu', { method: 'POST', body: item, auth: true }); }
  async function updateMenuItem(id, updates) { return request('/menu/' + id, { method: 'PUT', body: updates, auth: true }); }
  async function deleteMenuItem(id) { return request('/menu/' + id, { method: 'DELETE', auth: true }); }

  /* ---------- Auth (staff & admin) ---------- */
  async function login(email, password) {
    const data = await request('/auth/login', { method: 'POST', body: { email, password } });
    const session = { token: data.token, user: data.user, createdAt: new Date().toISOString() };
    setStorage(STORAGE_KEYS.SESSION, session);
    return session;
  }
  async function logout() {
    try { await request('/auth/logout', { method: 'POST', auth: true }); } catch { /* ignore */ }
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    return true;
  }
  async function getSession() {
    const stored = getStorage(STORAGE_KEYS.SESSION, null);
    if (!stored || !stored.token) return null;
    try {
      const data = await request('/auth/session', { auth: true });
      const session = { token: stored.token, user: data.user, createdAt: stored.createdAt };
      setStorage(STORAGE_KEYS.SESSION, session);   // refresh cached user (role, etc.)
      return session;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.SESSION); // token invalid/expired
      return null;
    }
  }

  /* ---------- Coupons (public list + admin create) ---------- */
  async function getCoupons() { return request('/coupons'); }

  /* ---------- Reviews (read-only, shown on the public menu) ---------- */
  async function getReviews(dishId) { return request('/reviews' + (dishId ? '?dishId=' + dishId : '')); }

  /* ---------- Users (admin) ---------- */
  async function getUsers(role) { return request('/users' + (role ? '?role=' + role : ''), { auth: true }); }
  async function createUser(user) { return request('/users', { method: 'POST', body: user, auth: true }); }
  async function updateUser(id, updates) { return request('/users/' + id, { method: 'PUT', body: updates, auth: true }); }
  async function disableUser(id) { return request('/users/' + id, { method: 'DELETE', auth: true }); }

  /* ---------- Bills (staff) ---------- */
  async function createBill(bill) { return request('/bills', { method: 'POST', body: bill, auth: true }); }
  async function getBills() { return request('/bills', { auth: true }); }
  async function getBill(id) { return request('/bills/' + id, { auth: true }); }

  /* ---------- Audit (admin) ---------- */
  async function getAuditLogs(opts = {}) {
    const params = new URLSearchParams();
    if (opts.limit) params.set('limit', opts.limit);
    if (opts.action) params.set('action', opts.action);
    const qs = params.toString();
    return request('/audit' + (qs ? '?' + qs : ''), { auth: true });
  }

  /* ---------- Admin stats ---------- */
  async function getAdminStats() { return request('/admin/stats', { auth: true }); }

  return {
    STORAGE_KEYS,
    getMenu, getAllMenuItems, getMenuItem, addMenuItem, updateMenuItem, deleteMenuItem,
    login, logout, getSession,
    getCoupons,
    getReviews,
    getUsers, createUser, updateUser, disableUser,
    createBill, getBills, getBill,
    getAuditLogs,
    getAdminStats
  };
})();
