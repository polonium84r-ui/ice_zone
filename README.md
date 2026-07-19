# Thirst. — One for Living 🍫

The website + counter system for **Thirst.** (📍 Kakkalur, Thiruvallur · [@thirst_fresh](https://www.instagram.com/thirst_fresh)) — handcrafted hot chocolate, loaded waffles, thick shakes, brownies, pancakes & more, made fresh daily from 5 PM to 10 PM.

A small full-stack app: a **vanilla HTML/CSS/JavaScript** frontend (no build step) backed by a **Node.js + Express + SQLite** REST API with **JWT authentication** and **role-based access control**. It has two parts:

- **Public site** (customer-facing, mobile-first) — a browse-only showcase of the menu. There is **no online ordering or customer login**; all sales happen at the counter.
- **Staff / Admin console** (desktop) — a **Billing / POS** for walk-in sales with shareable PDF receipts, plus an **admin dashboard** to manage the menu, users, coupons, and an audit log.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3 (custom design system — no CSS framework), Vanilla JavaScript (ES6+, module-pattern IIFEs) |
| **Backend** | Node.js, [Express](https://expressjs.com/) `^4.21` |
| **Database** | [SQLite](https://www.sqlite.org/) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) `^11.3` (synchronous, single-file, WAL mode) |
| **Auth** | [`jsonwebtoken`](https://github.com/auth0/node-jsonwebtoken) `^9.0` (JWT Bearer tokens, 7-day expiry) + [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js) `^2.4` (password hashing) |
| **API middleware** | [`cors`](https://github.com/expressjs/cors) `^2.8`, `express.json` |
| **Fonts** | Google Fonts — Pacifico, Playfair Display, Inter |
| **Frontend libraries (CDN)** | [jsPDF](https://github.com/parallax/jsPDF) `2.5.1` + [html2canvas](https://html2canvas.hertzen.com/) `1.4.1` (receipt → PDF, billing page only) |
| **PWA** | Web App Manifest + Service Worker (`sw.js`, cache-first shell, bypasses `/api/`) |
| **Runtime** | Node.js **18+** |

**No bundler or transpiler** — the browser runs the source directly, and in local dev the Express server also hosts the static site, so a single command runs the whole stack.

---

## ✨ What each part does

### 🌐 Public site (mobile-first)
- **Home** (`index.html`) — hero, why-Thirst, popular treats (pulled live from the menu)
- **Menu** (`menu.html`) — category filters, live search, veg-only toggle, sort (popularity / rating / price), and a read-only dish detail view
- **About** (`about.html`) — story, values, outlet, contact & franchise enquiry forms

### 🧾 Staff — Billing / POS (`billing.html`, desktop)
- Build a walk-in bill from the live menu or **custom line items**
- Auto-numbered invoices (`INV-YYYYMMDD-NNNN`), **5% GST**, discounts
- Generate a **PDF receipt** and share it — **Send on WhatsApp**, **Download PDF**, or **Print** (isolated 80mm thermal layout)
- View recent bills and re-open any receipt

### 🛠️ Admin (`admin.html`, desktop)
- **Dashboard** — today's bills & revenue, average rating, active coupons, weekly bills chart
- **Menu Management** — add / edit / delete items, toggle availability
- **User Management** — create & manage staff/admin accounts, enable/disable (soft-disable; can't disable the last admin)
- **Coupons** — active coupon reference
- **Audit Log** — every login, bill, menu edit, and user change recorded with actor, role, timestamp, and details

Roles are **admin** and **staff** only — there is no customer account.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18 or newer** (`node --version`)

### Install & run
The Express server serves both the API and the static site in local dev, so one process runs everything.

```bash
cd server
npm install     # express, better-sqlite3, bcryptjs, jsonwebtoken, cors
npm run seed    # creates server/data/thirst.db and seeds the menu, coupons & bootstrap users
npm start       # starts API + site at http://localhost:4000
```

Then open **http://localhost:4000**. The staff/admin console is at **/admin**.

### Resetting the database
The database is a single file at `server/data/thirst.db`.
- Delete it and re-run `npm run seed` for a clean slate.
- Re-running `npm run seed` is **idempotent**; the menu is versioned (`MENU_VERSION` in `seed.js`) and re-seeds fully when bumped.

### Configuration (environment variables)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `4000` | Port for the API + static site |
| `NODE_ENV` | — | Set to `production` to serve API-only (frontend hosted separately) |
| `THIRST_JWT_SECRET` | random per-process | Fixed JWT signing secret — **set this in production** so sessions survive restarts |
| `THIRST_ADMIN_EMAIL` | `admin@thirst.in` | Bootstrap admin email (seed) |
| `THIRST_ADMIN_PASSWORD` | `ChangeMe@123` | Bootstrap admin password — **set this in production** |
| `THIRST_STAFF_EMAIL` | `staff@thirst.in` | Bootstrap staff email (seed) |
| `THIRST_STAFF_PASSWORD` | `ChangeMe@123` | Bootstrap staff password |

```bash
PORT=5000 THIRST_JWT_SECRET=your-long-random-secret \
THIRST_ADMIN_PASSWORD=your-strong-admin-password npm start
```

> ⚠️ **Security:** the seed only creates the admin/staff accounts if they don't already exist. Always set `THIRST_ADMIN_PASSWORD` (and `THIRST_JWT_SECRET`) in production, and change the password after first login.

---

## 📁 Project Structure

```
├── index.html              # Home (public, mobile-first)
├── menu.html               # Menu browse (filters, search, sort)
├── about.html              # About, values, contact
├── login.html              # Staff / admin login  (served at /admin)
├── admin.html              # Admin console (dashboard, menu, users, audit, coupons)
├── billing.html            # Staff Billing / POS — PDF receipts + sharing
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (caches shell, bypasses /api/)
├── assets/
│   ├── thirst-logo.png     # Brand logo (favicon, navbars, receipts)
│   └── hero.jpg            # Home hero photo
├── css/
│   └── styles.css          # Design system + responsive breakpoints
├── js/
│   ├── data.js             # Frontend display constants (categories, promos, outlet, features)
│   ├── api.js              # REST client for the backend (fetch + JWT)
│   ├── auth.js             # Session management & role guards
│   ├── app.js              # Shared UI utilities, validation, toasts, HTML escaping
│   └── admin.js            # Admin console logic (menu, users, audit, coupons)
└── server/                 # ── Backend (Node + Express + SQLite) ──
    ├── server.js           # Express app: REST API + static host
    ├── db.js               # SQLite connection + schema
    ├── auth.js             # JWT + bcrypt helpers, auth/role middleware
    ├── audit.js            # Audit-log writer
    ├── seed.js             # Idempotent database seed (menu, coupons, users)
    ├── package.json        # Backend dependencies & scripts
    └── data/               # thirst.db lives here (gitignored)
```

---

## 🌐 API Reference

All endpoints are under the **`/api/v1`** prefix. 🔒 = requires a valid token.

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /auth/login`, `POST /auth/logout` 🔒, `GET /auth/session` |
| **Menu** | `GET /menu`, `GET /menu/all` 🔒staff, `GET /menu/:id`, `POST` / `PUT /:id` / `DELETE /:id` 🔒admin |
| **Coupons** | `GET /coupons`, `POST /coupons` 🔒admin |
| **Reviews** | `GET /reviews` (read-only) |
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
| `users` | Accounts — role (`admin`/`staff`), bcrypt hash, active flag |
| `menu_items` | Products — name, category, description, price, image, rating, tags, availability |
| `coupons` | Discount codes — percentage/flat, min order, category scope |
| `reviews` | Item ratings & comments (read-only on the public menu) |
| `bills` | Walk-in POS invoices — line items, GST, totals, payment method |
| `audit_logs` | Trail of every meaningful action (actor, role, entity, details, IP) |

---

## 🍧 Menu & Categories

Seeded from the current Thirst. menu (`server/seed.js`, versioned via `MENU_VERSION`):

`Hot Chocolate` · `Crushers` · `Shakes` · `Waffles` · `Pancakes` · `Brownies & Cakes` · `Maggi` · `Combos`

Menu **item photos** currently use stock image URLs as placeholders — replace the `image` field of each item (via Admin → Menu Management, or in `seed.js`) with real product photos for production.

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

The public site is mobile-first and responsive; the POS and admin console are designed for desktop use. Dynamic values rendered into the page are HTML-escaped (`App.escapeHtml`).

---

## 📲 PWA / Offline

- Installable via `manifest.json` (icons, theme color, app shortcuts)
- `sw.js` uses a cache-first strategy for the app shell and **bypasses `/api/`** requests so data is always fresh
- HTTPS is required for install / service worker in production

---

## ☁️ Deployment

- **Frontend** — static hosting (e.g. Vercel; see `vercel.json` for the clean-URL rewrites, including `/admin` → `login.html`).
- **Backend** — Node service (e.g. Render; see `render.yaml`). Set `NODE_ENV=production`, `THIRST_JWT_SECRET`, and `THIRST_ADMIN_PASSWORD`. In production the API runs on its own origin; the frontend points at it via `window.THIRST_API` or the built-in fallback in `js/api.js`.

---

## 📄 License

Built for **Thirst.** All rights reserved.
