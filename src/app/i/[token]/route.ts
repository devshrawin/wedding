import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { grantAccess } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { hit, ipFromHeaders } from "@/lib/rate-limit";

/** Personal invite link: grants this browser access to an invite-only registry. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const origin = new URL(req.url).origin;
  const ip = ipFromHeaders(req.headers);
  if (!/^[a-z0-9]{20}$/.test(token) || !hit(`invite:${ip}`, 40, 10 * 60_000)) {
    return NextResponse.redirect(new URL("/invite-invalid", origin));
  }
  const db = await getDb();
  const [row] = await db
    .select({ invite: schema.invites, slug: schema.registries.slug })
    .from(schema.invites)
    .innerJoin(schema.registries, eq(schema.registries.id, schema.invites.registryId))
    .where(eq(schema.invites.token, token))
    .limit(1);
  if (!row) return NextResponse.redirect(new URL("/invite-invalid", origin));
  await grantAccess(row.invite.registryId, "invite", row.invite.id);
  await db
    .update(schema.invites)
    .set({ opens: sql`${schema.invites.opens} + 1`, lastOpenedAt: new Date() })
    .where(eq(schema.invites.id, row.invite.id));
  return NextResponse.redirect(new URL(`/r/${row.slug}`, origin));
}
