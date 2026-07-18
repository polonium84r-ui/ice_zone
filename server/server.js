/**
 * server.js — Thirst. REST API + static frontend host.
 * API under /api/v1/*, static site served from the project root.
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');
const audit = require('./audit');
const { hashPassword, verifyPassword, sanitizeUser, issueToken, authenticate, authorize } = require('./auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'http://localhost:4000',
    'http://localhost:3000',
    /\.vercel\.app$/,          // any Vercel preview/prod URL
    /\.onrender\.com$/         // Render URLs
  ],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// ---------- Row → API mappers ----------
const mapMenu = r => r && ({
  id: r.id, name: r.name, category: r.category, description: r.description,
  price: r.price, image: r.image, rating: r.rating, reviewCount: r.review_count,
  isVeg: !!r.is_veg, tags: JSON.parse(r.tags || '[]'), available: !!r.available
});
const mapCoupon = r => r && ({
  code: r.code, type: r.type, value: r.value, maxDiscount: r.max_discount,
  minOrder: r.min_order, category: r.category, description: r.description, active: !!r.active
});
const mapOrder = r => r && ({
  id: r.id, userId: r.user_id, customerName: r.customer_name,
  items: JSON.parse(r.items || '[]'), subtotal: r.subtotal, deliveryFee: r.delivery_fee,
  platformFee: r.platform_fee, gst: r.gst, couponDiscount: r.coupon_discount,
  pointsRedeemed: r.points_redeemed, pointsEarned: r.points_earned, grandTotal: r.grand_total,
  deliveryOption: r.delivery_option, address: r.address ? JSON.parse(r.address) : null,
  payment: r.payment ? JSON.parse(r.payment) : null, status: r.status, createdAt: r.created_at
});
const mapReview = r => r && ({
  id: r.id, dishId: r.dish_id, rating: r.rating, comment: r.comment,
  customerName: r.customer_name, orderId: r.order_id, createdAt: r.created_at
});
const mapBill = r => r && ({
  id: r.id, billNumber: r.bill_number, staffId: r.staff_id, staffName: r.staff_name,
  customerName: r.customer_name, customerPhone: r.customer_phone,
  items: JSON.parse(r.items || '[]'), subtotal: r.subtotal, discount: r.discount,
  tax: r.tax, total: r.total, paymentMethod: r.payment_method, notes: r.notes, createdAt: r.created_at
});

const wrap = fn => (req, res) => { try { fn(req, res); } catch (err) { console.error(err); res.status(500).json({ error: err.message || 'Server error' }); } };

// =====================================================================
//  AUTH
// =====================================================================
app.post('/api/v1/auth/login', wrap((req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(String(email || '').trim());
  if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (!user.active) return res.status(403).json({ error: 'This account has been disabled' });
  const token = issueToken(user);
  audit.log({ user, headers: req.headers, socket: req.socket }, 'auth.login', { entityType: 'user', entityId: user.id });
  res.json({ token, user: sanitizeUser(user) });
}));

app.post('/api/v1/auth/register', wrap((req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  const exists = db.prepare('SELECT 1 FROM users WHERE lower(email) = lower(?)').get(String(email).trim());
  if (exists) return res.status(409).json({ error: 'An account with this email already exists' });
  const id = 'cust-' + Date.now();
  db.prepare(`INSERT INTO users (id, name, email, password_hash, phone, role, reward_points, active, created_by)
              VALUES (?, ?, ?, ?, ?, 'customer', 0, 1, 'self')`)
    .run(id, name.trim(), email.trim(), hashPassword(password), (phone || '').trim());
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  audit.log({ user, headers: req.headers, socket: req.socket }, 'auth.register', { entityType: 'user', entityId: id });
  res.status(201).json({ token: issueToken(user), user: sanitizeUser(user) });
}));

app.post('/api/v1/auth/logout', authenticate, wrap((req, res) => {
  audit.log(req, 'auth.logout', { entityType: 'user', entityId: req.user.id });
  res.json({ ok: true }); // stateless JWT — client discards the token
}));

app.get('/api/v1/auth/session', authenticate, wrap((req, res) => {
  res.json({ user: sanitizeUser(req.user) });
}));

// =====================================================================
//  MENU
// =====================================================================
app.get('/api/v1/menu', wrap((req, res) => {
  const rows = db.prepare('SELECT * FROM menu_items WHERE available = 1 ORDER BY id').all();
  res.json(rows.map(mapMenu));
}));

app.get('/api/v1/menu/all', authenticate, authorize('staff'), wrap((req, res) => {
  res.json(db.prepare('SELECT * FROM menu_items ORDER BY id').all().map(mapMenu));
}));

app.get('/api/v1/menu/:id', wrap((req, res) => {
  const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Item not found' });
  res.json(mapMenu(row));
}));

app.post('/api/v1/menu', authenticate, authorize(), wrap((req, res) => {
  const b = req.body || {};
  if (!b.name || !b.category || !b.price || !b.image) return res.status(400).json({ error: 'Missing required fields' });
  const info = db.prepare(`INSERT INTO menu_items (name, category, description, price, image, rating, review_count, is_veg, tags, available)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 1)`)
    .run(b.name, b.category, b.description || '', Number(b.price), b.image, Number(b.rating) || 4.0,
         b.isVeg ? 1 : 0, JSON.stringify(Array.isArray(b.tags) ? b.tags : []));
  const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(info.lastInsertRowid);
  audit.log(req, 'menu.create', { entityType: 'menu', entityId: row.id, details: { name: row.name } });
  res.status(201).json(mapMenu(row));
}));

app.put('/api/v1/menu/:id', authenticate, authorize(), wrap((req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'Item not found' });
  const b = req.body || {};
  db.prepare(`UPDATE menu_items SET name=?, category=?, description=?, price=?, image=?, is_veg=?, tags=?, available=? WHERE id=?`)
    .run(b.name ?? cur.name, b.category ?? cur.category, b.description ?? cur.description,
         b.price != null ? Number(b.price) : cur.price, b.image ?? cur.image,
         b.isVeg != null ? (b.isVeg ? 1 : 0) : cur.is_veg,
         b.tags != null ? JSON.stringify(b.tags) : cur.tags,
         b.available != null ? (b.available ? 1 : 0) : cur.available, id);
  const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  audit.log(req, 'menu.update', { entityType: 'menu', entityId: id, details: { name: row.name } });
  res.json(mapMenu(row));
}));

app.delete('/api/v1/menu/:id', authenticate, authorize(), wrap((req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Item not found' });
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
  audit.log(req, 'menu.delete', { entityType: 'menu', entityId: id, details: { name: row.name } });
  res.json({ ok: true });
}));

// =====================================================================
//  COUPONS
// =====================================================================
app.get('/api/v1/coupons', wrap((req, res) => {
  res.json(db.prepare('SELECT * FROM coupons WHERE active = 1').all().map(mapCoupon));
}));

app.post('/api/v1/coupons/validate', wrap((req, res) => {
  const { code, cartItems = [], subtotal = 0 } = req.body || {};
  const row = db.prepare('SELECT * FROM coupons WHERE upper(code) = upper(?) AND active = 1').get(String(code || '').trim());
  if (!row) return res.status(404).json({ error: 'Invalid coupon code' });
  const coupon = mapCoupon(row);
  if (coupon.minOrder && subtotal < coupon.minOrder) {
    return res.status(400).json({ error: `Minimum order of ₹${coupon.minOrder} required for this coupon` });
  }
  let discount = 0;
  if (coupon.type === 'percentage') {
    let applicable = subtotal;
    if (coupon.category) {
      const ids = cartItems.map(ci => ci.id);
      const menu = ids.length ? db.prepare(`SELECT id, price, category FROM menu_items WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids) : [];
      applicable = cartItems.reduce((sum, ci) => {
        const m = menu.find(x => x.id === ci.id);
        return m && m.category === coupon.category ? sum + m.price * ci.quantity : sum;
      }, 0);
      if (applicable === 0) return res.status(400).json({ error: 'This coupon is only valid for ' + coupon.category });
    }
    discount = (applicable * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === 'flat') {
    discount = coupon.value;
  }
  res.json({ coupon, discount: Math.round(discount * 100) / 100 });
}));

// admin coupon management
app.post('/api/v1/coupons', authenticate, authorize(), wrap((req, res) => {
  const b = req.body || {};
  if (!b.code || !b.type || b.value == null) return res.status(400).json({ error: 'code, type and value are required' });
  db.prepare(`INSERT INTO coupons (code, type, value, max_discount, min_order, category, description, active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(b.code.toUpperCase(), b.type, Number(b.value), b.maxDiscount ?? null, Number(b.minOrder) || 0,
         b.category || null, b.description || '', b.active === false ? 0 : 1);
  audit.log(req, 'coupon.create', { entityType: 'coupon', entityId: b.code });
  res.status(201).json(mapCoupon(db.prepare('SELECT * FROM coupons WHERE code = ?').get(b.code.toUpperCase())));
}));

// =====================================================================
//  PAYMENTS (simulated gateway — mirrors the original demo behaviour)
// =====================================================================
const FAIL_REASONS = [
  'Network connection lost during transaction', 'Payment gateway timeout — please retry',
  'Transaction cancelled by payment provider', 'Insufficient funds or card declined', 'UPI ID verification failed'
];
app.post('/api/v1/payments/process', wrap((req, res) => {
  const { method, amount, forceFail = false } = req.body || {};
  const canRandomFail = method !== 'cod';
  if (forceFail || (canRandomFail && Math.random() < 0.3)) {
    return res.status(402).json({ error: FAIL_REASONS[Math.floor(Math.random() * FAIL_REASONS.length)] });
  }
  res.json({ transactionId: 'TXN' + Date.now(), status: 'success', method, amount });
}));

// =====================================================================
//  ORDERS
// =====================================================================
app.post('/api/v1/orders', authenticate, wrap((req, res) => {
  const b = req.body || {};
  const id = 'ORD-' + Date.now().toString(36).toUpperCase();
  const pointsEarned = Math.floor((Number(b.grandTotal) || 0) / 10);
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO orders (id, user_id, customer_name, items, subtotal, delivery_fee, platform_fee, gst,
      coupon_discount, points_redeemed, points_earned, grand_total, delivery_option, address, payment, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Placed')`)
      .run(id, req.user.id, b.customerName || req.user.name, JSON.stringify(b.items || []),
           b.subtotal || 0, b.deliveryFee || 0, b.platformFee || 0, b.gst || 0, b.couponDiscount || 0,
           b.pointsRedeemed || 0, pointsEarned, b.grandTotal || 0, b.deliveryOption || 'standard',
           b.address ? JSON.stringify(b.address) : null, b.payment ? JSON.stringify(b.payment) : null);
    const newPoints = (req.user.reward_points || 0) - (b.pointsRedeemed || 0) + pointsEarned;
    db.prepare('UPDATE users SET reward_points = ? WHERE id = ?').run(Math.max(0, newPoints), req.user.id);
  });
  tx();
  audit.log(req, 'order.place', { entityType: 'order', entityId: id, details: { total: b.grandTotal } });
  res.status(201).json(mapOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id)));
}));

// staff/admin: all orders
app.get('/api/v1/orders', authenticate, authorize('staff'), wrap((req, res) => {
  res.json(db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all().map(mapOrder));
}));

// customer: only their own orders
app.get('/api/v1/orders/mine', authenticate, wrap((req, res) => {
  res.json(db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id).map(mapOrder));
}));

app.put('/api/v1/orders/:id/status', authenticate, authorize('staff'), wrap((req, res) => {
  const cur = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Order not found' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  audit.log(req, 'order.status', { entityType: 'order', entityId: req.params.id, details: { from: cur.status, to: req.body.status } });
  res.json(mapOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)));
}));

// =====================================================================
//  REVIEWS
// =====================================================================
app.get('/api/v1/reviews', wrap((req, res) => {
  const dishId = req.query.dishId ? Number(req.query.dishId) : null;
  const rows = dishId
    ? db.prepare('SELECT * FROM reviews WHERE dish_id = ? ORDER BY created_at DESC').all(dishId)
    : db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  res.json(rows.map(mapReview));
}));

app.post('/api/v1/reviews', authenticate, wrap((req, res) => {
  const b = req.body || {};
  const id = 'rev-' + Date.now();
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO reviews (id, dish_id, rating, comment, customer_name, order_id)
                VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, b.dishId, b.rating, b.comment || '', b.customerName || req.user.name, b.orderId || null);
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(b.dishId);
    if (item) {
      const total = item.rating * item.review_count + Number(b.rating);
      const count = item.review_count + 1;
      db.prepare('UPDATE menu_items SET rating = ?, review_count = ? WHERE id = ?')
        .run(Math.round((total / count) * 10) / 10, count, b.dishId);
    }
  });
  tx();
  audit.log(req, 'review.create', { entityType: 'menu', entityId: b.dishId, details: { rating: b.rating } });
  res.status(201).json(mapReview(db.prepare('SELECT * FROM reviews WHERE id = ?').get(id)));
}));

// =====================================================================
//  USERS (admin only — staff & customer management)
// =====================================================================
app.get('/api/v1/users', authenticate, authorize(), wrap((req, res) => {
  const role = req.query.role;
  const rows = role
    ? db.prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC').all(role)
    : db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json(rows.map(sanitizeUser));
}));

app.post('/api/v1/users', authenticate, authorize(), wrap((req, res) => {
  const b = req.body || {};
  if (!b.name || !b.email || !b.password || !b.role) return res.status(400).json({ error: 'name, email, password and role are required' });
  if (!['admin', 'staff', 'customer'].includes(b.role)) return res.status(400).json({ error: 'Invalid role' });
  const exists = db.prepare('SELECT 1 FROM users WHERE lower(email) = lower(?)').get(b.email.trim());
  if (exists) return res.status(409).json({ error: 'An account with this email already exists' });
  const id = b.role + '-' + Date.now();
  db.prepare(`INSERT INTO users (id, name, email, password_hash, phone, role, reward_points, active, created_by)
              VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?)`)
    .run(id, b.name.trim(), b.email.trim(), hashPassword(b.password), (b.phone || '').trim(), b.role, req.user.id);
  audit.log(req, 'user.create', { entityType: 'user', entityId: id, details: { role: b.role, email: b.email } });
  res.status(201).json(sanitizeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id)));
}));

app.put('/api/v1/users/:id', authenticate, authorize(), wrap((req, res) => {
  const cur = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'User not found' });
  const b = req.body || {};
  // Guard: don't let the last active admin be demoted or disabled.
  if (cur.role === 'admin' && (b.role && b.role !== 'admin' || b.active === false)) {
    const admins = db.prepare("SELECT COUNT(*) c FROM users WHERE role='admin' AND active=1").get().c;
    if (admins <= 1) return res.status(400).json({ error: 'Cannot demote or disable the last active admin' });
  }
  db.prepare(`UPDATE users SET name=?, phone=?, role=?, active=? WHERE id=?`)
    .run(b.name ?? cur.name, b.phone ?? cur.phone, b.role ?? cur.role,
         b.active != null ? (b.active ? 1 : 0) : cur.active, req.params.id);
  if (b.password) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(b.password), req.params.id);
  audit.log(req, 'user.update', { entityType: 'user', entityId: req.params.id, details: { role: b.role, active: b.active } });
  res.json(sanitizeUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)));
}));

app.delete('/api/v1/users/:id', authenticate, authorize(), wrap((req, res) => {
  const cur = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'User not found' });
  if (cur.id === req.user.id) return res.status(400).json({ error: 'You cannot disable your own account' });
  if (cur.role === 'admin') {
    const admins = db.prepare("SELECT COUNT(*) c FROM users WHERE role='admin' AND active=1").get().c;
    if (admins <= 1) return res.status(400).json({ error: 'Cannot disable the last active admin' });
  }
  db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(req.params.id); // soft-disable preserves history
  audit.log(req, 'user.disable', { entityType: 'user', entityId: req.params.id, details: { email: cur.email } });
  res.json({ ok: true });
}));

// =====================================================================
//  BILLS / RECEIPTS (staff & admin — walk-in POS)
// =====================================================================
function nextBillNumber() {
  const today = new Date();
  const ymd = today.getFullYear().toString() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
  const count = db.prepare("SELECT COUNT(*) c FROM bills WHERE bill_number LIKE ?").get(`INV-${ymd}-%`).c;
  return `INV-${ymd}-${String(count + 1).padStart(4, '0')}`;
}

app.post('/api/v1/bills', authenticate, authorize('staff'), wrap((req, res) => {
  const b = req.body || {};
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return res.status(400).json({ error: 'At least one line item is required' });
  const subtotal = items.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0);
  const discount = Number(b.discount) || 0;
  const taxRate = b.taxRate != null ? Number(b.taxRate) : 0.05;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * taxRate * 100) / 100;
  const total = Math.round((taxable + tax) * 100) / 100;
  const id = 'bill-' + Date.now();
  const billNumber = nextBillNumber();
  db.prepare(`INSERT INTO bills (id, bill_number, staff_id, staff_name, customer_name, customer_phone, items,
    subtotal, discount, tax, total, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, billNumber, req.user.id, req.user.name, b.customerName || 'Walk-in Customer', b.customerPhone || '',
         JSON.stringify(items), Math.round(subtotal * 100) / 100, discount, tax, total, b.paymentMethod || 'cash', b.notes || '');
  audit.log(req, 'bill.create', { entityType: 'bill', entityId: billNumber, details: { total } });
  res.status(201).json(mapBill(db.prepare('SELECT * FROM bills WHERE id = ?').get(id)));
}));

app.get('/api/v1/bills', authenticate, authorize('staff'), wrap((req, res) => {
  // staff see their own bills; admin sees all
  const rows = req.user.role === 'admin'
    ? db.prepare('SELECT * FROM bills ORDER BY created_at DESC').all()
    : db.prepare('SELECT * FROM bills WHERE staff_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map(mapBill));
}));

app.get('/api/v1/bills/:id', authenticate, authorize('staff'), wrap((req, res) => {
  const row = db.prepare('SELECT * FROM bills WHERE id = ? OR bill_number = ?').get(req.params.id, req.params.id);
  if (!row) return res.status(404).json({ error: 'Bill not found' });
  res.json(mapBill(row));
}));

// =====================================================================
//  AUDIT LOG (admin only)
// =====================================================================
app.get('/api/v1/audit', authenticate, authorize(), wrap((req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  const action = req.query.action;
  const rows = action
    ? db.prepare('SELECT * FROM audit_logs WHERE action LIKE ? ORDER BY created_at DESC LIMIT ?').all(action + '%', limit)
    : db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  res.json(rows.map(r => ({
    id: r.id, userId: r.user_id, userName: r.user_name, userRole: r.user_role,
    action: r.action, entityType: r.entity_type, entityId: r.entity_id,
    details: r.details ? tryParse(r.details) : null, ip: r.ip, createdAt: r.created_at
  })));
}));
function tryParse(s) { try { return JSON.parse(s); } catch { return s; } }

// =====================================================================
//  ADMIN STATS
// =====================================================================
app.get('/api/v1/admin/stats', authenticate, authorize('staff'), wrap((req, res) => {
  const orders = db.prepare('SELECT grand_total, created_at, status FROM orders').all();
  const bills = db.prepare('SELECT total, created_at FROM bills').all();
  const menu = db.prepare('SELECT rating FROM menu_items').all();
  const coupons = db.prepare('SELECT active FROM coupons').all();
  const reviews = db.prepare('SELECT COUNT(*) c FROM reviews').get().c;
  const staffCount = db.prepare("SELECT COUNT(*) c FROM users WHERE role='staff' AND active=1").get().c;

  const todayStr = new Date().toDateString();
  const isToday = d => new Date(d).toDateString() === todayStr;
  const todayOrders = orders.filter(o => isToday(o.created_at));
  const todayBills = bills.filter(bl => isToday(bl.created_at));
  const todayRevenue = todayOrders.reduce((s, o) => s + o.grand_total, 0) + todayBills.reduce((s, bl) => s + bl.total, 0);
  const avgRating = menu.length ? Math.round(menu.reduce((s, m) => s + m.rating, 0) / menu.length * 10) / 10 : 0;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyOrders = weekDays.map((day, i) => ({
    day, count: orders.filter(o => new Date(o.created_at).getDay() === i).length
  }));

  res.json({
    todayOrders: todayOrders.length,
    todayBills: todayBills.length,
    todayRevenue,
    avgRating,
    activeCoupons: coupons.filter(c => c.active).length,
    totalReviews: reviews,
    staffCount,
    weeklyOrders
  });
}));

// ---------- Health ----------
app.get('/api/v1/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---------- Static frontend (served from project root, local dev only) ----------
// On Render the frontend is hosted separately on Vercel; we still serve it locally.
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '..')));
} else {
  // In production only serve /api/* — the frontend lives on Vercel
  app.get('/', (req, res) => res.json({ ok: true, service: 'Thirst. API', env: 'production' }));
}

// API 404 (after routes, before static fallthrough would send index for unknown /api)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => console.log(`Thirst. server running → http://localhost:${PORT}`));
