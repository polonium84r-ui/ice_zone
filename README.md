# Thirst. — Sweet Stories, Frozen 🍦

The official ordering platform for **Thirst.** (📍 Thiruvallur · [@popsicle__stories](https://www.instagram.com/popsicle__stories)) — handcrafted kunafa, kulfi & frozen treats.

A full-stack food-ordering application: a **vanilla HTML/CSS/JavaScript** frontend (no build step) backed by a **Node.js + Express + SQLite** REST API with **JWT authentication** and **role-based access control**. It covers the complete journey — customers browsing and ordering online, staff running a walk-in **Billing/POS** with shareable PDF receipts, and admins managing the menu, orders, users, coupons, reviews, and a full **audit log**.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3 (custom design system — no CSS framework), Vanilla JavaScript (ES6+, module-pattern IIFEs) |
| **Backend** | Node.js, [Express](https://expressjs.com/) `^4.21` |
| **Database** | [SQLite](https://www.sqlite.org/) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) `^11.3` (synchronous, single-file, WAL mode) |
| **Auth** | [`jsonwebtoken`](https://github.com/auth0/node-jsonwebtoken) `^9.0` (JWT Bearer tokens, 7-day expiry) + [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js) `^2.4` (password hashing) |
| **API middleware** | [`cors`](https://github.com/expressjs/cors) `^2.8`, `express.json` |
| **Fonts** | Google Fonts — Pacifico (wordmark), Playfair Display (headings), Inter (body) |
| **Frontend libraries (CDN)** | [GSAP](https://gsap.com/) `3.12.5` + ScrollTrigger (hero scroll story), [jsPDF](https://github.com/parallax/jsPDF) `2.5.1` + [html2canvas](https://html2canvas.hertzen.com/) `1.4.1` (receipt → PDF), [JSZip](https://stuk.github.io/jszip/) `3.10.1` (frame-extraction dev tool only) |
| **PWA** | Web App Manifest + Service Worker (`sw.js`, cache-first shell, bypasses `/api/`) |
| **Runtime** | Node.js **18+** |

**No bundler, transpiler, or Node framework on the frontend** — the browser runs the source directly, and the Express server also hosts the static site, so a single command runs the whole stack.

---

## ✨ Features

### 🛒 Customer
- Browse the menu with **category filters, live search, veg-only toggle, and sorting** (popularity, rating, price)
- **Shopping cart** with real-time quantity updates and persistent per-device state
- **Coupons** — order-based and category-specific discount validation
- **Reward points** — earn on orders, redeem up to 50% of the bill
- **Simulated payment gateway** with realistic failure handling (cart & checkout state preserved on failure)
- **Order history** with details and reorder
- **Reviews & ratings** that update the item's live rating

### 🧾 Staff — Billing / POS
- Build a walk-in bill from the live menu or **custom line items**
- Auto-numbered invoices (`INV-YYYYMMDD-NNNN`), **5% GST**, discounts
- Generate a **PDF receipt** and share it — **Send on WhatsApp**, **Download PDF**, or **Print** (isolated 80mm thermal layout)
- View recent bills and re-open any receipt

### 🛠️ Admin
- **Dashboard** — today's orders/revenue, average rating, weekly orders, staff count
- **Menu Management** — add / edit / delete items, toggle availability
- **Order Management** — view all orders, update status
- **User Management** — create & manage staff/customer accounts, enable/disable
- **Coupons** and **Reviews** overview
- **Audit Log** — every login, order, bill, menu edit, and user change recorded with actor, role, timestamp, and details

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18 or newer** (`node --version`)

### Install & run
The Express server serves both the API and the static site, so one process runs everything.

```bash
cd server
npm install     # express, better-sqlite3, bcryptjs, jsonwebtoken, cors
npm run seed    # creates server/data/thirst.db and seeds menu, coupons, demo users
npm start       # starts API + site at http://localhost:4000
```

Then open **http://localhost:4000**.

### Resetting the database
The database is a single file at `server/data/thirst.db`.
- Delete it and re-run `npm run seed` for a clean slate.
- Re-running `npm run seed` is **idempotent** — it only inserts rows that don't already exist.

### Configuration (environment variables)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `4000` | Port for the API + static site |
| `THIRST_JWT_SECRET` | random per-process | Fixed JWT signing secret — **set this in production** so tokens survive restarts |

```bash
PORT=5000 THIRST_JWT_SECRET=your-long-random-secret npm start
```

---

## 🔑 Demo Accounts

| Role | Email | Password | Lands on | Can do |
|------|-------|----------|----------|--------|
| **Admin** | `admin@thirst.in` | `Admin@123` | `admin.html` | Everything — menu, orders, users, audit, coupons, billing |
| **Staff** | `staff@thirst.in` | `Staff@123` | `billing.html` | Walk-in billing / receipts, view & update orders |
| **Customer** | `customer@test.com` | `Test@123` | `menu.html` | Browse, order online, track orders |

New **customer** accounts can self-register via the Sign Up modal. **Staff and admin accounts are created by an admin** in User Management. On the login page, customers use the **Customer Login** tab; staff and admins use the **Staff / Admin** tab.

---

## 📁 Project Structure

```
Popsicle-Stories/
├── index.html              # Home — hero scroll story (GSAP), PWA + SEO
├── menu.html               # Menu & ordering (filters, search, sort)
├── cart.html               # Cart & checkout (payment simulation)
├── orders.html             # Customer order history & tracking
├── login.html              # Role-aware login (customer / staff / admin)
├── about.html              # About, values, contact
├── admin.html              # Admin console (dashboard, menu, orders, users, audit, coupons, reviews)
├── billing.html            # Staff Billing / POS — PDF receipts + sharing
├── extract-frames.html     # Dev tool: extract video frames for the hero animation (JSZip)
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (caches shell, bypasses /api/)
├── assets/
│   └── thirst-logo.png     # Brand logo (favicon, navbars, receipts)
├── css/
│   └── styles.css          # Complete design system + responsive breakpoints
├── js/
│   ├── data.js             # Frontend constants (categories, promos, testimonials)
│   ├── api.js              # REST client for the backend (fetch + JWT)
│   ├── auth.js             # Session management & role guards
│   ├── cart.js             # Cart & pricing logic
│   ├── app.js              # Shared UI utilities, validation, toasts, auth UI
│   ├── admin.js            # Admin console logic (users, audit, coupons)
│   └── scroll-animation.js # Canvas frame-sequence hero animation
└── server/                 # ── Backend (Node + Express + SQLite) ──
    ├── server.js           # Express app: REST API + static host
    ├── db.js               # SQLite connection + schema
    ├── auth.js             # JWT + bcrypt helpers, auth/role middleware
    ├── audit.js            # Audit-log writer
    ├── seed.js             # Idempotent database seed
    ├── package.json        # Backend dependencies & scripts
    └── data/               # thirst.db lives here (gitignored)
```

---

## 🏗️ Architecture

```
Browser (vanilla JS)  ──fetch + JWT──►  Express  ──►  better-sqlite3  ──►  thirst.db
   │                                       │
   │  cart / checkout draft / addresses    │  serves the static frontend
   └─ localStorage (per-device state)      └─ all persistent data + auth + audit
```

- **The frontend never touches the database directly.** All data access goes through `js/api.js`, which calls the REST API under `/api/v1`.
- **Client-local working state** (cart contents, checkout draft, saved addresses) lives in `localStorage`; **everything persistent** (users, menu, orders, bills, reviews, coupons, audit) lives server-side in SQLite.
- **Auth:** login returns a JWT; the client stores it and sends `Authorization: Bearer <token>` on protected calls. Passwords are bcrypt-hashed; admins implicitly pass all role checks.

---

## 🌐 API Reference

All endpoints are under the **`/api/v1`** prefix. 🔒 = requires a valid token.

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /auth/login`, `POST /auth/register`, `POST /auth/logout` 🔒, `GET /auth/session` 🔒 |
| **Menu** | `GET /menu`, `GET /menu/all` 🔒staff, `GET /menu/:id`, `POST` / `PUT /:id` / `DELETE /:id` 🔒admin |
| **Coupons** | `GET /coupons`, `POST /coupons/validate`, `POST /coupons` 🔒admin |
| **Orders** | `POST /orders` 🔒, `GET /orders` 🔒staff, `GET /orders/mine` 🔒, `PUT /orders/:id/status` 🔒staff |
| **Reviews** | `GET /reviews`, `POST /reviews` 🔒 |
| **Payments** | `POST /payments/process` (simulated gateway) |
| **Users** | `GET` / `POST /users` 🔒admin, `PUT` / `DELETE /users/:id` 🔒admin |
| **Bills** | `POST /bills` 🔒staff, `GET /bills` 🔒staff, `GET /bills/:id` 🔒staff |
| **Audit** | `GET /audit` 🔒admin |
| **Stats** | `GET /admin/stats` 🔒staff |
| **Health** | `GET /health` |

Role notes: `staff` endpoints are also open to `admin`. `DELETE /users/:id` is a **soft-disable** (`active = 0`) and cannot remove the last active admin.

---

## 🗄️ Database Schema

SQLite tables (see `server/db.js`):

| Table | Purpose |
|-------|---------|
| `users` | Accounts — role (`admin`/`staff`/`customer`), bcrypt hash, reward points, active flag |
| `menu_items` | Products — name, category, description, price, image, rating, tags, availability |
| `coupons` | Discount codes — percentage/flat, min order, category scope |
| `orders` | Online orders — items (JSON), totals, delivery, payment, status |
| `reviews` | Item ratings & comments (updates the item's aggregate rating) |
| `bills` | Walk-in POS invoices — line items, GST, totals, payment method |
| `audit_logs` | Immutable trail of every meaningful action (actor, role, entity, details, IP) |

---

## 👥 Roles & Permissions

- **Admin** — full access; manages menu, orders, coupons, reviews, and users, and reviews the audit log. Admin bypasses all role checks.
- **Staff** — runs the Billing/POS terminal and can view/update order statuses.
- **Customer** — browses, orders online with cart/coupons/reward points, and tracks their own orders.

---

## 🍧 Menu & Categories

24 seeded items across six categories:

`Signature` · `Kunafa Specials` · `Fruit Pops` · `Chocolate & Nutty` · `Kulfi Classics` · `Shakes & Sips`

## 🎟️ Coupons

| Code | Discount | Conditions |
|------|----------|------------|
| `SWEET20` | 20% off (max ₹100) | Any order |
| `FLAT50` | ₹50 flat off | Orders above ₹299 |
| `KUNAFA10` | 10% off | `Kunafa Specials` category only |

## 🎁 Reward Points

- Earn **1 point per ₹10** spent on successful orders
- **1 point = ₹1** redemption value
- Redeem up to **50%** of the bill at checkout
- The demo customer starts with **120 points**

## 💳 Payment Simulation

`POST /api/v1/payments/process` fakes a gateway:
- **~30% random failure** on card/UPI (Cash on Delivery never fails randomly)
- **Force failure** button always triggers an error, for demos
- On failure, the cart, coupon, reward redemption, delivery choice, and address are **all preserved**; on success the cart clears and points are credited

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#C4213C` (berry red) |
| Accent | `#E0A82E` (caramel gold) |
| Dark | `#1A0E08` (chocolate) |
| Background | `#FFF8F1` (vanilla cream) |
| Fonts | Pacifico · Playfair Display · Inter |
| Breakpoints | 480px · 768px · 1024px · 1440px |
| Currency | Indian Rupee (₹), `en-IN` formatting |

The interface is responsive and keyboard-accessible, with ARIA labels, focus styles, and reduced-motion handling throughout.

---

## 📲 PWA / Offline

- Installable via `manifest.json` (icons, theme color, app shortcuts)
- `sw.js` uses a cache-first strategy for the app shell and **bypasses `/api/`** requests so data is always fresh
- HTTPS is required for install / service worker in production

---

## ⚠️ Known Limitations

1. **Simulated payments** — swap `POST /payments/process` for a real provider (Razorpay, Stripe, …) for live transactions.
2. **Single-node SQLite** — ideal for one store/counter. For multi-outlet scale, migrate to Postgres/MySQL (the SQL and API layer port over directly).
3. **No email/SMS** — order and receipt notifications are on-screen only.
4. **Demo images** — menu images use the Unsplash CDN; replace with your own for production.

---

## 📄 License

Built for **Thirst.** All rights reserved.
