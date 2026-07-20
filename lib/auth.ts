/**
 * auth.ts — JWT + bcrypt helpers and route-handler auth for the API.
 * Same semantics as the original Express middleware: Bearer tokens with a
 * 7-day expiry, roles admin | staff, admin implicitly allowed everywhere.
 */
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "./db";

// In production set THIRST_JWT_SECRET in the environment. For local/dev we
// generate a stable-per-process fallback so tokens work without config.
const JWT_SECRET =
  process.env.THIRST_JWT_SECRET ||
  "thirst-dev-secret-" + crypto.randomBytes(8).toString("hex");
const TOKEN_TTL = "7d";

if (!process.env.THIRST_JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn(
    "[auth] THIRST_JWT_SECRET is not set in production — using a random per-process secret. All sessions will be invalidated on every restart. Set THIRST_JWT_SECRET to a long random value."
  );
}

export function hashPassword(plain: string) {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compareSync(plain, hash);
}

export function sanitizeUser(user: User | null) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    rewardPoints: user.rewardPoints,
    active: user.active,
    createdBy: user.createdBy,
    createdAt: user.createdAt,
  };
}

export function issueToken(user: User) {
  return jwt.sign({ sub: user.id, role: user.role, name: user.name }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

/** Resolves the active user from a Bearer token, or null. Never throws. */
export async function userFromRequest(req: Request): Promise<User | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    return user && user.active ? user : null;
  } catch {
    return null;
  }
}

/**
 * requireAuth(req, ...roles) — returns the authenticated user or a Response
 * with the appropriate 401/403 error. Admin is implicitly allowed everywhere;
 * pass no roles to restrict to admin only.
 */
export async function requireAuth(
  req: Request,
  ...roles: string[]
): Promise<User | Response> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return jsonError(401, "Authentication required");
  let payload: { sub: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch {
    return jsonError(401, "Invalid or expired session");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active) return jsonError(401, "Session invalid or account disabled");
  if (user.role === "admin") return user; // admin has all permissions
  if (roles.includes(user.role)) return user;
  return jsonError(403, "You do not have permission to perform this action");
}

export function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}
