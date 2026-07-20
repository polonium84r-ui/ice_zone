import { requireAuth } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await requireAuth(req, "staff");
  if (user instanceof Response) return user;
  await auditLog(req, user, "auth.logout", { entityType: "user", entityId: user.id });
  return Response.json({ ok: true }); // stateless JWT — client discards the token
}
