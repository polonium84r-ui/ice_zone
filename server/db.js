/**
 * db.js — SQLite connection + schema (better-sqlite3, synchronous)
 * The database file lives at server/data/thirst.db
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// On Render, use the mounted persistent disk at /data; locally use server/data
const DATA_DIR = process.env.RENDER ? '/data' : path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'thirst.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone         TEXT,
    role          TEXT NOT NULL DEFAULT 'customer',   -- admin | staff | customer
    reward_points INTEGER NOT NULL DEFAULT 0,
    active        INTEGER NOT NULL DEFAULT 1,
    created_by    TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL,
    description  TEXT,
    price        REAL NOT NULL,
    image        TEXT,
    rating       REAL NOT NULL DEFAULT 4.0,
    review_count INTEGER NOT NULL DEFAULT 0,
    is_veg       INTEGER NOT NULL DEFAULT 1,
    tags         TEXT NOT NULL DEFAULT '[]',           -- JSON array
    available    INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS coupons (
    code         TEXT PRIMARY KEY,
    type         TEXT NOT NULL,                        -- percentage | flat
    value        REAL NOT NULL,
    max_discount REAL,
    min_order    REAL NOT NULL DEFAULT 0,
    category     TEXT,
    description  TEXT,
    active       INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    user_id         TEXT,
    customer_name   TEXT,
    items           TEXT NOT NULL,                     -- JSON array
    subtotal        REAL NOT NULL DEFAULT 0,
    delivery_fee    REAL NOT NULL DEFAULT 0,
    platform_fee    REAL NOT NULL DEFAULT 0,
    gst             REAL NOT NULL DEFAULT 0,
    coupon_discount REAL NOT NULL DEFAULT 0,
    points_redeemed INTEGER NOT NULL DEFAULT 0,
    points_earned   INTEGER NOT NULL DEFAULT 0,
    grand_total     REAL NOT NULL DEFAULT 0,
    delivery_option TEXT,
    address         TEXT,                              -- JSON object
    payment         TEXT,                              -- JSON object
    status          TEXT NOT NULL DEFAULT 'Placed',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id            TEXT PRIMARY KEY,
    dish_id       INTEGER,
    rating        INTEGER NOT NULL,
    comment       TEXT,
    customer_name TEXT,
    order_id      TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bills (
    id             TEXT PRIMARY KEY,
    bill_number    TEXT NOT NULL UNIQUE,
    staff_id       TEXT,
    staff_name     TEXT,
    customer_name  TEXT,
    customer_phone TEXT,
    items          TEXT NOT NULL,                      -- JSON array
    subtotal       REAL NOT NULL DEFAULT 0,
    discount       REAL NOT NULL DEFAULT 0,
    tax            REAL NOT NULL DEFAULT 0,
    total          REAL NOT NULL DEFAULT 0,
    payment_method TEXT,
    notes          TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT,
    user_name   TEXT,
    user_role   TEXT,
    action      TEXT NOT NULL,
    entity_type TEXT,
    entity_id   TEXT,
    details     TEXT,
    ip          TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_bills_created  ON bills(created_at);
  CREATE INDEX IF NOT EXISTS idx_audit_created  ON audit_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_reviews_dish   ON reviews(dish_id);
`);

module.exports = db;
