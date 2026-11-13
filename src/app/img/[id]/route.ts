import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

/** Serves uploaded pictures. IDs are random and unguessable; contents never change. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{16,24}$/.test(id)) return new Response("Not found", { status: 404 });
  const db = await getDb();
  const [img] = await db.select().from(schema.images).where(eq(schema.images.id, id)).limit(1);
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      "Content-Length": String(img.bytes),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
