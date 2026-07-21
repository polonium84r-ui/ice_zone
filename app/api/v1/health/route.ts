export async function GET() {
  // Only expose a simple status — no server time or internal details
  return Response.json({ ok: true });
}
