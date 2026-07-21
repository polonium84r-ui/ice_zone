import { prisma } from "@/lib/db";
import { requireAuth, hashPassword, sanitizeUser, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import {
  generateId,
  truncate,
  validatePasswordStrength,
  safeError,
} from "@/lib/security";

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_PHONE = 20;

export async function GET(req: Request) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  // Validate role filter to prevent arbitrary query injection
  if (role && !["admin", "staff"].includes(role)) {
    return jsonError(400, "Invalid role filter");
  }
  try {
    const rows = await prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return Response.json(rows.map(sanitizeUser));
  } catch {
    return safeError(500, "Failed to retrieve users.");
  }
}

export async function POST(req: Request) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;

  let b: Record<string, string>;
  try {
    b = (await req.json()) as Record<string, string>;
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  if (!b.name || !b.email || !b.password || !b.role) {
    return jsonError(400, "name, email, password and role are required");
  }
  if (!["admin", "staff"].includes(b.role)) return jsonError(400, "Invalid role");

  // Server-side password strength validation
  const passwordError = validatePasswordStrength(b.password);
  if (passwordError) return jsonError(400, passwordError);

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(b.email.trim())) {
    return jsonError(400, "Invalid email format");
  }

  const sanitizedEmail = truncate(b.email, MAX_EMAIL).trim();

  const exists = await prisma.user.findFirst({
    where: { email: { equals: sanitizedEmail, mode: "insensitive" } },
  });
  if (exists) return jsonError(409, "An account with this email already exists");

  // Use cryptographic UUID instead of predictable timestamp ID
  const id = generateId(b.role);

  try {
    const created = await prisma.user.create({
      data: {
        id,
        name: truncate(b.name, MAX_NAME).trim(),
        email: sanitizedEmail,
        passwordHash: hashPassword(b.password),
        phone: truncate(b.phone || "", MAX_PHONE).trim(),
        role: b.role,
        rewardPoints: 0,
        active: true,
        createdBy: user.id,
      },
    });
    await auditLog(req, user, "user.create", {
      entityType: "user",
      entityId: id,
      details: { role: b.role, email: sanitizedEmail },
    });
    return Response.json(sanitizeUser(created), { status: 201 });
  } catch {
    return safeError(500, "Failed to create user. Please try again.");
  }
}
