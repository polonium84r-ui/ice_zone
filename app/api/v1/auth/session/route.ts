import { userFromRequest, sanitizeUser } from "@/lib/auth";

// Public session check — never 401s (returns { user: null } for an
// absent / expired / invalid token) so it stays out of the browser console.
export async function GET(req: Request) {
  const user = await userFromRequest(req);
  return Response.json({ user: user ? sanitizeUser(user) : null });
}
