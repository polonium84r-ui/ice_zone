import { prisma } from "@/lib/db";
import { verifyPassword, sanitizeUser, issueToken, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    const user = await prisma.user.findFirst({
      where: { email: { equals: String(email || "").trim(), mode: "insensitive" } },
    });
    if (!user || !verifyPassword(String(password || ""), user.passwordHash)) {
      return jsonError(401, "Invalid email or password");
    }
    if (!user.active) return jsonError(403, "This account has been disabled");
    const token = issueToken(user);
    await auditLog(req, user, "auth.login", { entityType: "user", entityId: user.id });
    return Response.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    return jsonError(500, (err as Error).message || "Server error");
  }
}
