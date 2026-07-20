# Thirst. — One for Living 🍫

The website + counter system for **Thirst.** (📍 Kakkalur, Thiruvallur · [@thirst_fresh](https://www.instagram.com/thirst_fresh)) — handcrafted hot chocolate, loaded waffles, thick shakes, brownies, pancakes & more, made fresh daily from 5 PM to 10 PM.

A full-stack **Next.js** app: a TypeScript React frontend and API routes in one project, backed by **PostgreSQL** via **Prisma**, with **JWT authentication** and **role-based access control**. It has two parts:

- **Public site** (customer-facing, mobile-first) — a browse-only showcase of the menu. There is **no online ordering or customer login**; all sales happen at the counter.
- **Staff / Admin console** (desktop) — a **Billing / POS** for walk-in sales with shareable PDF receipts, plus an **admin dashboard** to manage the menu, users, coupons, and an audit log.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | [Next.js](https://nextjs.org/) 15 (App Router) + TypeScript + React 19 |
| **UI** | [Tailwind CSS](https://tailwindcss.com/) v4 + [shadcn/ui](https://ui.shadcn.com/), themed with the Thirst. design system |
| **Backend** | Next.js API Routes (`/api/v1/*`) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) 16 |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Auth** | [`jsonwebtoken`](https://github.com/auth0/node-jsonwebtoken) (JWT Bearer tokens, 7-day expiry) + [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js) (password hashing) |
| **Fonts** | Google Fonts — Pacifico, Playfair Display, Inter |
| **PDF receipts** | [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) (billing page) |
| **PWA** | Web App Manifest + Service Worker (`public/sw.js`, cache-first shell, bypasses `/api/`) |
| **Local DB** | Docker Compose (`docker compose up -d db`) |
| **Runtime** | Node.js **18+** |

---

## ✨ What each part does

### 🌐 Public site (mobile-first)
- **Home** (`/`) — hero, why-Thirst, popular treats (pulled live from the menu)
- **Menu** (`/menu`) — category filters, live search, veg-only toggle, sort (popularity / rating / price), and a read-only dish detail view
- **About** (`/about`) — story, values, outlet, contact & franchise enquiry forms

### 🧾 Staff — Billing / POS (`/billing`, desktop)
- Build a walk-in bill from the live menu or **custom line items**
- Auto-numbered invoices (`INV-YYYYMMDD-NNNN`), **5% GST**, discounts
- Generate a **PDF receipt** and share it — **Send on WhatsApp**, **Download PDF**, or **Print** (isolated 80mm thermal layout)
- View recent bills and re-open any receipt

### 🛠️ Admin (`/admin/dashboard`, desktop)
- **Dashboard** — today's bills & revenue, average rating, active coupons, weekly bills chart
- **Menu Management** — add / edit / delete items, toggle availability
- **User Management** — create & manage staff/admin accounts, enable/disable (soft-disable; can't disable the last admin)
- **Coupons** — active coupon reference
- **Audit Log** — every login, bill, menu edit, and user change recorded with actor, role, timestamp, and details

Roles are **admin** and **staff** only — there is no customer account. The staff/admin login lives at **`/admin`**.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18 or newer** (`node --version`)
- **Docker** (for the local PostgreSQL database)

### Install & run

```bash
npm install
docker compose up -d db     # start PostgreSQL 16 (localhost:5432)
npx prisma migrate dev      # create the tables
npm run seed                # seed the menu, coupons & bootstrap users
npm run dev                 # → http://localhost:3000
```

Then open **http://localhost:3000**. The staff/admin console is at **/admin**.

### Resetting the database
- `docker compose down -v` removes the database volume; re-run migrate + seed for a clean slate.
- Re-running `npm run seed` is **idempotent**; the menu is versioned (`MENU_VERSION` in `prisma/seed.ts`) and re-seeds fully when bumped.

### Configuration (environment variables)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | local docker Postgres | PostgreSQL connection string |
| `THIRST_JWT_SECRET` | random per-process | Fixed JWT signing secret — **set this in production** so sessions survive restarts |
| `THIRST_ADMIN_EMAIL` | `admin@thirst.in` | Bootstrap admin email (seed) |
| `THIRST_ADMIN_PASSWORD` | `ChangeMe@123` | Bootstrap admin password — **set this in production** |
| `THIRST_STAFF_EMAIL` | `staff@thirst.in` | Bootstrap staff email (seed) |
| `THIRST_STAFF_PASSWORD` | `ChangeMe@123` | Bootstrap staff password |

> ⚠️ **Security:** the seed only creates the admin/staff accounts if they don't already exist. Always set `THIRST_ADMIN_PASSWORD` (and `THIRST_JWT_SECRET`) in production, and change the password after first login.

---

## 📁 Project Structure

```
├── app/
│   ├── layout.tsx            # Root layout: fonts, SEO, PWA registration
│   ├── globals.css           # Tailwind + the Thirst. design system
│   ├── page.tsx              # Home (public, mobile-first)
│   ├── menu/                 # Menu browse (filters, search, sort)
│   ├── about/                # About, values, contact
│   ├── admin/                # Staff / admin login  (/admin)
│   │   └── dashboard/        # Admin console (dashboard, menu, users, audit, coupons)
│   ├── billing/              # Staff Billing / POS — PDF receipts + sharing
│   └── api/v1/               # REST API route handlers (see API Reference)
├── components/               # Navbar, Footer, DishCard, Modal, Reveal + shadcn/ui
├── lib/
│   ├── db.ts                 # Prisma client singleton
│   ├── auth.ts               # JWT + bcrypt helpers, route-handler auth
│   ├── audit.ts              # Audit-log writer
│   ├── mappers.ts            # DB row → API shape
│   └── client/               # Frontend: REST client, display constants, utilities
├── prisma/
│   ├── schema.prisma         # PostgreSQL schema
│   └── seed.ts               # Idempotent database seed (menu, coupons, users)
├── public/                   # Logo, hero photo, manifest.json, sw.js
├── docker-compose.yml        # Local PostgreSQL 16
└── render.yaml               # Render deploy (web service + Postgres)
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

Role notes: `staff` endpoints are also open to `admin`. `DELETE /users/:id` is a **soft-disable** (`active = false`) and cannot remove the last active admin.

---

## 🗄️ Database Schema

PostgreSQL tables (see `prisma/schema.prisma`):

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

Seeded from the current Thirst. menu (`prisma/seed.ts`, versioned via `MENU_VERSION`):

`Hot Chocolate` · `Crushers` · `Shakes` · `Waffles` · `Pancakes` · `Brownies & Cakes` · `Maggi` · `Combos`

Menu **item photos** currently use stock image URLs as placeholders — replace the `image` field of each item (via Admin → Menu Management, or in `seed.ts`) with real product photos for production.

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

The tokens live in `app/globals.css` — both as CSS variables (`--color-primary`, …) and as a Tailwind `@theme`, so utilities like `bg-primary` and `font-display` match the brand. The public site is mobile-first and responsive; the POS and admin console are designed for desktop use.

---

## 📲 PWA / Offline

- Installable via `public/manifest.json` (icons, theme color, app shortcuts)
- `public/sw.js` uses a cache-first strategy for the app shell and **bypasses `/api/`** requests so data is always fresh
- HTTPS is required for install / service worker in production

---

## ☁️ Deployment

One Next.js app serves both the site and the API — deploy it anywhere Next.js runs, plus a hosted PostgreSQL:

- **Vercel** — import the repo, add `DATABASE_URL` (e.g. [Neon](https://neon.tech/) / [Supabase](https://supabase.com/) / Render Postgres), `THIRST_JWT_SECRET`, and `THIRST_ADMIN_PASSWORD`. Run `npx prisma migrate deploy && npm run seed` against the production database once.
- **Render** — `render.yaml` provisions the web service **and** a managed PostgreSQL database; migrations run on every deploy and the seed is idempotent.

---

## 📄 License

Built for **Thirst.** All rights reserved.
