import { prisma } from "@/lib/db";
import { verifyPassword, sanitizeUser, issueToken, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import {
  isRateLimited,
  rateLimitRetryAfter,
  extractClientIp,
  truncate,
} from "@/lib/security";

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };

    const normalizedEmail = truncate(email, 254).trim().toLowerCase();
    const clientIp = extractClientIp(req) || "unknown";

    // Rate limit: 5 attempts per 15 minutes per IP+email combination
    const rateLimitKey = `login:${clientIp}:${normalizedEmail}`;
    if (isRateLimited(rateLimitKey)) {
      const retryAfter = rateLimitRetryAfter(rateLimitKey);
      await auditLog(req, null, "auth.login.rate_limited", {
        entityType: "user",
        details: { email: normalizedEmail, ip: clientIp },
      });
      return new Response(
        JSON.stringify({
          error: "Too many login attempts. Please try again later.",
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (!user || !verifyPassword(String(password || ""), user.passwordHash)) {
      // Log failed login attempt for audit trail
      await auditLog(req, null, "auth.login.failed", {
        entityType: "user",
        details: { email: normalizedEmail },
      });
      return jsonError(401, "Invalid email or password");
    }

    if (!user.active) return jsonError(403, "This account has been disabled");

    const token = issueToken(user);
    await auditLog(req, user, "auth.login", { entityType: "user", entityId: user.id });
    return Response.json({ token, user: sanitizeUser(user) });
  } catch {
    // Never leak internal error details to the client
    return jsonError(500, "An unexpected error occurred. Please try again.");
  }
}
