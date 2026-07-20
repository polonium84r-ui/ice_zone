/**
 * api.ts — Data access layer for the Thirst. frontend.
 * Talks to the Next.js API routes over REST (JWT auth). Only the staff/admin
 * session token is kept in localStorage; everything else is persisted
 * server-side. There is no customer role.
 */

const BASE = "/api/v1";

// Only the staff/admin session lives client-side.
export const STORAGE_KEYS = { SESSION: "ps_session" } as const;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "staff";
  rewardPoints: number;
  active: boolean;
  createdBy: string | null;
  createdAt: string;
};

export type Session = { token: string; user: SessionUser; createdAt: string };

export type MenuItem = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  isVeg: boolean;
  tags: string[];
  available: boolean;
};

export type Coupon = {
  code: string;
  type: "percentage" | "flat";
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  category: string | null;
  description: string;
  active: boolean;
};

export type Review = {
  id: string;
  dishId: number | null;
  rating: number;
  comment: string | null;
  customerName: string | null;
  orderId: string | null;
  createdAt: string;
};

export type BillItem = { name: string; price: number; quantity: number };

export type Bill = {
  id: string;
  billNumber: string;
  staffId: string | null;
  staffName: string | null;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  notes: string;
  createdAt: string;
};

export type AuditEntry = {
  id: number;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: unknown;
  ip: string | null;
  createdAt: string;
};

export type AdminStats = {
  todayBills: number;
  todayRevenue: number;
  avgRating: number;
  activeCoupons: number;
  staffCount: number;
  weeklyBills: { day: string; count: number }[];
};

/* ---------- storage helpers (session only) ---------- */
function getStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    return fallback;
  }
}
function setStorage(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getToken(): string | null {
  const session = getStorage<Session | null>(STORAGE_KEYS.SESSION, null);
  return session && session.token ? session.token : null;
}

/* ---------- fetch wrapper ---------- */
async function request<T>(
  pathname: string,
  { method = "GET", body, auth = false }: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
  }
  let res: globalThis.Response;
  try {
    res = await fetch(BASE + pathname, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Please make sure the backend is running.");
  }
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: string }).error)
        : "Request failed (" + res.status + ")";
    throw new Error(msg);
  }
  return data as T;
}

/* ---------- Menu ---------- */
export const getMenu = () => request<MenuItem[]>("/menu");
export const getAllMenuItems = () => request<MenuItem[]>("/menu/all", { auth: true });
export const getMenuItem = (id: number) => request<MenuItem>("/menu/" + id);
export const addMenuItem = (item: Partial<MenuItem>) =>
  request<MenuItem>("/menu", { method: "POST", body: item, auth: true });
export const updateMenuItem = (id: number, updates: Partial<MenuItem>) =>
  request<MenuItem>("/menu/" + id, { method: "PUT", body: updates, auth: true });
export const deleteMenuItem = (id: number) =>
  request<{ ok: true }>("/menu/" + id, { method: "DELETE", auth: true });

/* ---------- Auth (staff & admin) ---------- */
export async function login(email: string, password: string): Promise<Session> {
  const data = await request<{ token: string; user: SessionUser }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  const session: Session = {
    token: data.token,
    user: data.user,
    createdAt: new Date().toISOString(),
  };
  setStorage(STORAGE_KEYS.SESSION, session);
  return session;
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST", auth: true });
  } catch {
    /* ignore */
  }
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  return true;
}

function isTokenExpired(token: string) {
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    return !exp || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export async function getSession(): Promise<Session | null> {
  const stored = getStorage<Session | null>(STORAGE_KEYS.SESSION, null);
  if (!stored || !stored.token) return null;
  // Drop a locally-expired token without hitting the server.
  if (isTokenExpired(stored.token)) {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    return null;
  }
  try {
    const data = await request<{ user: SessionUser | null }>("/auth/session", { auth: true });
    if (!data || !data.user) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      return null;
    }
    const session: Session = {
      token: stored.token,
      user: data.user,
      createdAt: stored.createdAt,
    };
    setStorage(STORAGE_KEYS.SESSION, session); // refresh cached user (role, etc.)
    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.SESSION); // token invalid/expired
    return null;
  }
}

/* ---------- Coupons (public list) ---------- */
export const getCoupons = () => request<Coupon[]>("/coupons");

/* ---------- Reviews (read-only, shown on the public menu) ---------- */
export const getReviews = (dishId?: number) =>
  request<Review[]>("/reviews" + (dishId ? "?dishId=" + dishId : ""));

/* ---------- Users (admin) ---------- */
export const getUsers = (role?: string) =>
  request<SessionUser[]>("/users" + (role ? "?role=" + role : ""), { auth: true });
export const createUser = (user: {
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
}) => request<SessionUser>("/users", { method: "POST", body: user, auth: true });
export const updateUser = (id: string, updates: Record<string, unknown>) =>
  request<SessionUser>("/users/" + id, { method: "PUT", body: updates, auth: true });
export const disableUser = (id: string) =>
  request<{ ok: true }>("/users/" + id, { method: "DELETE", auth: true });

/* ---------- Bills (staff) ---------- */
export const createBill = (bill: {
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  discount: number;
  taxRate: number;
  paymentMethod: string;
}) => request<Bill>("/bills", { method: "POST", body: bill, auth: true });
export const getBills = () => request<Bill[]>("/bills", { auth: true });
export const getBill = (id: string) => request<Bill>("/bills/" + id, { auth: true });

/* ---------- Audit (admin) ---------- */
export function getAuditLogs(opts: { limit?: number; action?: string } = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.action) params.set("action", opts.action);
  const qs = params.toString();
  return request<AuditEntry[]>("/audit" + (qs ? "?" + qs : ""), { auth: true });
}

/* ---------- Admin stats ---------- */
export const getAdminStats = () => request<AdminStats>("/admin/stats", { auth: true });
