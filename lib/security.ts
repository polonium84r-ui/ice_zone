/**
 * security.ts — Shared security utilities for the Thirst. API.
 *
 * Provides:
 * - In-memory sliding-window rate limiter (login brute-force protection)
 * - Input sanitisation helpers (truncate, clamp, sanitise arrays)
 * - Cryptographic ID generation (unpredictable UUIDs)
 * - Safe API error response (never leaks internals to the client)
 * - IP extraction from x-forwarded-for with validation
 * - Server-side password strength validation
 */
import crypto from "crypto";

/* ---------- Rate Limiter (sliding window, in-memory) ---------- */

type RateLimitEntry = { timestamps: number[] };

const rateLimitStore = new Map<string, RateLimitEntry>();

// Prune stale entries every 10 minutes to prevent memory leaks.
const PRUNE_INTERVAL_MS = 10 * 60 * 1000;
setInterval(() => {
  const cutoff = Date.now();
  for (const [key, entry] of rateLimitStore) {
    entry.timestamps = entry.timestamps.filter((t) => cutoff - t < 15 * 60 * 1000);
    if (entry.timestamps.length === 0) rateLimitStore.delete(key);
  }
}, PRUNE_INTERVAL_MS).unref?.();

/**
 * Check and record a rate-limited action.
 * Returns `true` if the request is **blocked** (rate limit exceeded).
 *
 * @param key    Unique key for the action (e.g. `login:{ip}:{email}`)
 * @param limit  Max allowed attempts within the window (default: 5)
 * @param windowMs  Sliding window in milliseconds (default: 15 minutes)
 */
export function isRateLimited(
  key: string,
  limit = 5,
  windowMs = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    return true; // blocked
  }

  entry.timestamps.push(now);
  return false; // allowed
}

/**
 * Returns how many seconds the caller must wait before their next attempt.
 * Returns 0 if not currently limited.
 */
export function rateLimitRetryAfter(
  key: string,
  limit = 5,
  windowMs = 15 * 60 * 1000
): number {
  const entry = rateLimitStore.get(key);
  if (!entry) return 0;

  const now = Date.now();
  const active = entry.timestamps.filter((t) => now - t < windowMs);

  if (active.length < limit) return 0;

  // The oldest timestamp in the window determines when a slot opens.
  const oldest = Math.min(...active);
  return Math.max(0, Math.ceil((oldest + windowMs - now) / 1000));
}

/* ---------- Input Sanitisation ---------- */

/** Truncate a string to a maximum length. */
export function truncate(value: unknown, maxLength: number): string {
  const s = String(value ?? "");
  return s.length > maxLength ? s.slice(0, maxLength) : s;
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Validate and sanitise a tags array: limit count and per-tag length. */
export function sanitiseTags(
  tags: unknown,
  maxTags = 10,
  maxTagLength = 50
): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .slice(0, maxTags)
    .map((t) => truncate(t, maxTagLength))
    .filter((t) => t.length > 0);
}

/* ---------- Cryptographic IDs ---------- */

/** Generate a cryptographically random UUID (v4). */
export function generateId(prefix?: string): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}

/* ---------- Safe Error Response ---------- */

/**
 * Return a safe JSON error response. In production, internal details are
 * hidden; in development, the full message is returned for debugging.
 */
export function safeError(status: number, publicMessage: string, err?: unknown) {
  if (err) {
    console.error(`[API ${status}]`, publicMessage, err);
  }
  return Response.json({ error: publicMessage }, { status });
}

/* ---------- IP Extraction ---------- */

const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

/**
 * Extract the client IP from the request, preferring x-forwarded-for.
 * Only the first IP in the chain is used, and it is validated to look
 * like a real IP address before being accepted.
 */
export function extractClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (IPV4_REGEX.test(firstIp) || IPV6_REGEX.test(firstIp)) {
      return firstIp;
    }
    return null; // Invalid format — don't trust it
  }
  return null;
}

/* ---------- Password Strength ---------- */

/**
 * Validate password strength server-side.
 * Requirements: ≥8 chars, at least one uppercase, one lowercase, one digit,
 * and one special character.
 *
 * Returns null if valid, or an error message string if invalid.
 */
export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return "Password must contain at least one special character";
  }
  return null; // Valid
}

/* ---------- Numeric Validation ---------- */

/** Returns true if value is a finite positive number. */
export function isPositiveNumber(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

/** Returns true if value is a non-negative finite number. */
export function isNonNegativeNumber(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}
